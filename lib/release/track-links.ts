import "server-only";

import { storedTracks } from "@/lib/release/detail";
import { releaseSlug, trackSlug } from "@/lib/release/slug";
import type { MusicCatalog } from "@/lib/spotify/types";

/**
 * Parça ID → sitedeki sayfa adresi. Çok parçalı yayınlarda parçanın kendi sayfası,
 * tek parçalı yayınlarda yayın sayfası. Katalogda olmayan (işbirliği) parçalar listeye girmez.
 */
export function trackPageHrefs(catalog: MusicCatalog): Record<string, string> {
  const hrefs: Record<string, string> = {};
  for (const single of catalog.verifiedSingleTracks ?? []) {
    const release = catalog.releases.find((r) => r.id === single.albumId && r.verified);
    if (!release) continue;
    const base = `/muzik/${releaseSlug(release, catalog.releases)}`;
    const tracks = storedTracks(release.id);
    const stored = tracks.find((t) => t.id === single.id);
    hrefs[single.id] = tracks.length > 1 && stored ? `${base}/${trackSlug(stored, tracks)}` : base;
  }
  return hrefs;
}
