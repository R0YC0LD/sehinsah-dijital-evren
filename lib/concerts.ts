import type { Concert } from "@/data/concerts";

/** Etkinlik başladıktan sonra bu kadar süre daha "yaklaşan" sayılır (gece yarısını aşan konserler). */
export const CONCERT_GRACE_MS = 6 * 60 * 60 * 1000;

export function isUpcoming(concert: Pick<Concert, "startsAt">, now: number): boolean {
  const start = new Date(concert.startsAt).getTime();
  return Number.isFinite(start) && start + CONCERT_GRACE_MS > now;
}

export function upcomingConcerts<T extends Pick<Concert, "startsAt">>(list: T[], now: number): T[] {
  return list.filter((c) => isUpcoming(c, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
