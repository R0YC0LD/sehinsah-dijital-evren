import "server-only";

import { unstable_cache } from "next/cache";
import { Redis } from "@upstash/redis";
import snapshot from "@/data/generated/concerts.json";
import type { Concert } from "@/data/concerts";

/**
 * Konser verisinin kaynağı:
 *  1) Upstash KV (Vercel cron → app/api/cron/concerts Bubilet'ten günde 2 kez yazar) — canlı kaynak.
 *  2) data/generated/concerts.json — derlemeyle gelen yedek/anlık görüntü (KV yoksa/boşsa/erişilemezse).
 * İkisinden `updatedAt`'ı yeni olan kullanılır; bu yüzden takvim hiçbir zaman boş kalmaz.
 */
export const CONCERTS_KEY = "sehinsah:concerts:v1";
export const CONCERTS_LOCK_KEY = "sehinsah:concerts:lock";

export type StoredConcerts = { updatedAt: string; concerts: Concert[] };

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
export const redis = url && token ? new Redis({ url, token }) : null;

const KV_TIMEOUT_MS = 2500;

function isConcert(value: unknown): value is Concert {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.startsAt === "string" &&
    !Number.isNaN(new Date(c.startsAt).getTime()) &&
    typeof c.city === "string" &&
    typeof c.venue === "string" &&
    typeof c.ticketUrl === "string"
  );
}

function normalize(value: unknown): StoredConcerts | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { updatedAt?: unknown; concerts?: unknown };
  if (!Array.isArray(v.concerts)) return null;
  return {
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : "",
    concerts: v.concerts.filter(isConcert),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("kv_timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export async function readStoredConcerts(): Promise<StoredConcerts | null> {
  if (!redis) return null;
  const raw = await withTimeout(redis.get<unknown>(CONCERTS_KEY), KV_TIMEOUT_MS);
  return normalize(typeof raw === "string" ? JSON.parse(raw) : raw);
}

export async function writeStoredConcerts(concerts: Concert[]): Promise<void> {
  if (!redis) throw new Error("kv_not_configured");
  const value: StoredConcerts = { updatedAt: new Date().toISOString(), concerts };
  await withTimeout(redis.set(CONCERTS_KEY, value), KV_TIMEOUT_MS * 2);
}

/** Aynı anda/çok sık çalışmayı engeller (herkese açık rota Bubilet'e yük bindirmesin). */
export async function acquireLock(seconds: number): Promise<boolean> {
  if (!redis) return false;
  const ok = await redis.set(CONCERTS_LOCK_KEY, String(Date.now()), { nx: true, ex: seconds });
  return ok === "OK";
}

export async function holdLock(seconds: number): Promise<void> {
  if (redis) await redis.set(CONCERTS_LOCK_KEY, String(Date.now()), { ex: seconds });
}

async function loadConcerts(): Promise<Concert[]> {
  const bundled = normalize(snapshot) ?? { updatedAt: "", concerts: [] };
  let stored: StoredConcerts | null = null;
  try {
    stored = await readStoredConcerts();
  } catch {
    stored = null;
  }
  if (stored && stored.updatedAt >= bundled.updatedAt) return stored.concerts;
  return bundled.concerts;
}

/** 15 dk cache; cron güncelleyince `revalidateTag("concerts")` ile hemen tazelenir. */
export const getConcerts = unstable_cache(loadConcerts, ["concerts-v2"], {
  revalidate: 900,
  tags: ["concerts"],
});
