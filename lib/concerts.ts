import type { Concert } from "@/data/concerts";

/** Etkinlik başladıktan sonra bu kadar süre daha "yaklaşan" sayılır (gece yarısını aşan konserler). */
export const CONCERT_GRACE_MS = 6 * 60 * 60 * 1000;

export function isUpcoming(concert: Pick<Concert, "startsAt">, now: number): boolean {
  const start = new Date(concert.startsAt).getTime();
  return Number.isFinite(start) && start + CONCERT_GRACE_MS > now;
}

/**
 * Çok sanatçılı gece adları Bubilet'te "A & B & C" biçiminde gelir. 3 ve üzeri isim varsa
 * liste olarak döner (poster tarzı gösterim için); aksi halde [] (başlık olduğu gibi kalır).
 */
export function splitLineup(title: string): string[] {
  const names = title
    .split(/\s+&\s+/)
    .map((n) => n.trim())
    .filter(Boolean);
  return names.length >= 3 ? names : [];
}

export function upcomingConcerts<T extends Pick<Concert, "startsAt">>(list: T[], now: number): T[] {
  return list.filter((c) => isUpcoming(c, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
