import { isEpRelease } from "@/lib/spotify/normalize";
import type { SpotifyRelease } from "@/lib/spotify/types";

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** "2026-10-30" → "30 Ekim 2026". Sunucu/istemci aynı çıktıyı verir (Intl'e bağlı değil). */
export function formatReleaseDate(date: string): string {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(date || "");
  if (!m) return date || "";
  const [, year, month, day] = m;
  if (!month) return year;
  const name = MONTHS[Number(month) - 1];
  if (!name) return year;
  return day ? `${Number(day)} ${name} ${year}` : `${name} ${year}`;
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "";
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function releaseTypeLabel(release: Pick<SpotifyRelease, "albumType" | "totalTracks">): string {
  if (release.albumType === "album") return "Albüm";
  if (release.albumType === "compilation") return "Derleme";
  if (release.albumType === "ep" || isEpRelease(release)) return "EP";
  return "Tekli";
}
