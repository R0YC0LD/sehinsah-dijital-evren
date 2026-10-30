import type { SpotifyRelease } from "@/lib/spotify/types";

const TR_MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

export function slugify(value: string): string {
  return value
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `sodom-gomore-2026`; aynı ad+yıl çakışırsa ID'nin ilk 5 harfi eklenir. */
export function releaseSlug(release: SpotifyRelease, all: SpotifyRelease[]): string {
  const base = [slugify(release.name), release.releaseYear].filter(Boolean).join("-") || release.id;
  const clash = all.some((r) => r.id !== release.id && r.name && `${slugify(r.name)}-${r.releaseYear}` === base);
  return clash ? `${base}-${release.id.slice(0, 5).toLowerCase()}` : base;
}

export function findReleaseBySlug(all: SpotifyRelease[], slug: string): SpotifyRelease | null {
  return all.find((r) => releaseSlug(r, all) === slug) ?? null;
}
