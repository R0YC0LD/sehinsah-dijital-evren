import { entropyConfig } from "@/data/entropy";
import type { EntropySlotId } from "@/lib/entropy/types";
import { createSessionSeed } from "@/lib/entropy/seeded-random";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readEntropySeed(): string {
  if (!canUseStorage()) return "ssr";
  try {
    const existing = sessionStorage.getItem(entropyConfig.keys.seed);
    if (existing) return existing;
    const seed = createSessionSeed();
    sessionStorage.setItem(entropyConfig.keys.seed, seed);
    return seed;
  } catch {
    return createSessionSeed();
  }
}

export function readCollectedIds(): EntropySlotId[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(entropyConfig.keys.collected);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is EntropySlotId => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeCollectedIds(ids: EntropySlotId[]) {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(entropyConfig.keys.collected, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function readCompleted(): boolean {
  if (!canUseStorage()) return false;
  try {
    return sessionStorage.getItem(entropyConfig.keys.completed) === "1";
  } catch {
    return false;
  }
}

export function writeCompleted(value: boolean) {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(entropyConfig.keys.completed, value ? "1" : "0");
    if (value) {
      localStorage.setItem(entropyConfig.keys.achievement, "1");
    }
  } catch {
    /* ignore */
  }
}

export function readVideoShown(): boolean {
  if (!canUseStorage()) return false;
  try {
    return sessionStorage.getItem(entropyConfig.keys.videoShown) === "1";
  } catch {
    return false;
  }
}

export function writeVideoShown(value: boolean) {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(entropyConfig.keys.videoShown, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function resetEntropyStorage() {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(entropyConfig.keys.seed);
    sessionStorage.removeItem(entropyConfig.keys.collected);
    sessionStorage.removeItem(entropyConfig.keys.completed);
    sessionStorage.removeItem(entropyConfig.keys.videoShown);
  } catch {
    /* ignore */
  }
}
