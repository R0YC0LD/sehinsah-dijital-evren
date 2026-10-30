/**
 * Entropi 2. seviye — "Derin Entropi".
 *
 * 1. seviye (ana sayfadaki 5 beyin) bitince "kapı açılır": parça sayfalarında gizli beyinler belirir.
 * Hangi sayfada, nerede olduğu kullanıcıya özel (kalıcı) tohumdan türetilir; farklı kullanıcılar farklı
 * sayfalarda bulur. 5 FARKLI sayfadan beyin toplayan ödülü (duvar kağıtları) açar.
 */
export const DEEP_TOTAL = 5;

export const DEEP_KEYS = {
  seed: "sehinsah-entropy-deep-seed-v1",
  collected: "sehinsah-entropy-deep-collected-v1",
  completed: "sehinsah-entropy-deep-completed-v1",
} as const;

/** Yayınların ~%35'inde bir beyin vardır (5'ini toplamak için ortalama ~14 sayfa gezmek yeter). */
const PRESENCE_PERCENT = 35;

export type DeepPlacement = "stage" | "info" | "tracks" | "related";
const PLACEMENTS: DeepPlacement[] = ["stage", "info", "tracks", "related"];

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Bu kullanıcı için bu yayının sayfasında beyin var mı, varsa nerede? (deterministik) */
export function deepBrainFor(seed: string, releaseId: string): { visible: boolean; placement: DeepPlacement } {
  if (!seed) return { visible: false, placement: "stage" };
  const h = fnv1a(`${seed}:${releaseId}`);
  return {
    visible: h % 100 < PRESENCE_PERCENT,
    placement: PLACEMENTS[(h >>> 8) % PLACEMENTS.length],
  };
}

function canUse() {
  return typeof window !== "undefined";
}

export function readDeepSeed(): string {
  if (!canUse()) return "";
  try {
    const existing = localStorage.getItem(DEEP_KEYS.seed);
    if (existing) return existing;
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEEP_KEYS.seed, seed);
    return seed;
  } catch {
    return "";
  }
}

export function readDeepCollected(): string[] {
  if (!canUse()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DEEP_KEYS.collected) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeDeepCollected(ids: string[]) {
  if (!canUse()) return;
  try {
    localStorage.setItem(DEEP_KEYS.collected, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function readDeepCompleted(): boolean {
  if (!canUse()) return false;
  try {
    return localStorage.getItem(DEEP_KEYS.completed) === "1";
  } catch {
    return false;
  }
}

export function writeDeepCompleted() {
  if (!canUse()) return;
  try {
    localStorage.setItem(DEEP_KEYS.completed, "1");
  } catch {
    /* ignore */
  }
}
