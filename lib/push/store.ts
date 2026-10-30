import "server-only";
import { createHash } from "node:crypto";
import { kv } from "@/lib/kv";

const SUBS = "sehinsah:push:subs";
export const MAX_SUBSCRIBERS = 50_000;

export type PushTopics = { releases: boolean; concerts: boolean };

export type StoredSubscription = {
  sub: { endpoint: string; keys: { p256dh: string; auth: string } };
  topics: PushTopics;
  createdAt: string;
  updatedAt: string;
};

/**
 * Sunucunun POST edeceği adresler yalnızca bilinen push servisleri olmalı (SSRF önlemi):
 * Chrome/Brave/Edge → FCM, Firefox → Mozilla, Safari → Apple, Edge/Windows → WNS.
 * PUSH_EXTRA_HOSTS (virgüllü) yalnızca testler içindir.
 */
const ALLOWED_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

function hostAllowed(hostname: string): boolean {
  const extra = (process.env.PUSH_EXTRA_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean);
  return [...ALLOWED_SUFFIXES, ...extra].some((s) => hostname === s || hostname.endsWith(`.${s}`));
}

const B64URL = /^[A-Za-z0-9_-]{16,200}$/;

export function parseSubscription(input: unknown): StoredSubscription["sub"] | null {
  if (!input || typeof input !== "object") return null;
  const { endpoint, keys } = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof endpoint !== "string" || endpoint.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  const extra = process.env.PUSH_EXTRA_HOSTS ? url.protocol === "http:" : false;
  if (url.protocol !== "https:" && !extra) return null;
  if (!hostAllowed(url.hostname)) return null;
  if (typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") return null;
  if (!B64URL.test(keys.p256dh) || !B64URL.test(keys.auth)) return null;
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

export function parseTopics(input: unknown): PushTopics {
  const t = (input && typeof input === "object" ? input : {}) as Partial<PushTopics>;
  return { releases: t.releases !== false, concerts: t.concerts !== false };
}

const idOf = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex").slice(0, 32);

export async function countSubscribers(): Promise<number> {
  return kv ? await kv.hlen(SUBS) : 0;
}

export async function saveSubscription(sub: StoredSubscription["sub"], topics: PushTopics): Promise<void> {
  if (!kv) throw new Error("kv_not_configured");
  const id = idOf(sub.endpoint);
  const existing = await kv.hget<StoredSubscription>(SUBS, id);
  const now = new Date().toISOString();
  const value: StoredSubscription = { sub, topics, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await kv.hset(SUBS, { [id]: value });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  if (!kv) return;
  await kv.hdel(SUBS, idOf(endpoint));
}

export async function getSubscription(endpoint: string): Promise<StoredSubscription | null> {
  if (!kv) return null;
  return (await kv.hget<StoredSubscription>(SUBS, idOf(endpoint))) ?? null;
}

export async function listSubscriptions(): Promise<StoredSubscription[]> {
  if (!kv) return [];
  const all = await kv.hgetall<Record<string, StoredSubscription>>(SUBS);
  return all ? Object.values(all).filter((s) => s?.sub?.endpoint) : [];
}
