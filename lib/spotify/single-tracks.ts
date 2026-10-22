import "server-only";

import { unstable_cache } from "next/cache";
import { siteConfig } from "@/data/site";
import { filterVerifiedSingleTracks, isDeniedReleaseTitle } from "@/lib/spotify/normalize";
import { spotifyFetch } from "@/lib/spotify/server-client";
import type { SpotifyRelease, VerifiedSingleTrack } from "@/lib/spotify/types";

function revalidateSeconds() {
  const raw = Number(process.env.SPOTIFY_REVALIDATE_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

async function loadGeneratedSingleTracks(): Promise<VerifiedSingleTrack[]> {
  try {
    const data = (await import("@/data/generated/spotify-single-tracks.json")).default as {
      tracks?: VerifiedSingleTrack[];
      targetArtistId?: string;
      schemaVersion?: number;
    };
    if (data.targetArtistId && data.targetArtistId !== siteConfig.targetArtistId) {
      return [];
    }
    return filterVerifiedSingleTracks(data.tracks || []);
  } catch {
    return [];
  }
}

/** Tek yenilemede en fazla bu kadar yeni sürümün parçaları Spotify'dan çekilir. */
const MAX_NEW_RELEASES_PER_REFRESH = 15;

type AlbumTracksPage = {
  items: Array<{
    id: string;
    name: string;
    uri: string;
    duration_ms?: number;
    external_urls?: { spotify?: string };
    artists: Array<{ id?: string; name: string }>;
  }>;
};

/**
 * Üretilmiş JSON'daki parçalara, JSON'da henüz olmayan yeni tekli/EP sürümlerinin
 * parçalarını Spotify API'den ekler. Böylece yeni çıkan şarkı rastgele çalma
 * kuyruğuna elle JSON güncellenmeden girer. API hata verirse JSON'daki liste döner.
 */
export async function getVerifiedSingleTracksWithLive(
  releases: SpotifyRelease[],
): Promise<VerifiedSingleTrack[]> {
  const base = await getVerifiedSingleTracks();
  const known = new Set(base.map((t) => t.albumId));
  const market = process.env.SPOTIFY_MARKET || "TR";

  const fresh = releases
    .filter(
      (r) =>
        r.verified &&
        (r.albumType === "single" || r.albumType === "ep") &&
        !isDeniedReleaseTitle(r.name) &&
        !known.has(r.id),
    )
    .slice(0, MAX_NEW_RELEASES_PER_REFRESH);

  const added: VerifiedSingleTrack[] = [];
  for (const release of fresh) {
    try {
      const page = await spotifyFetch<AlbumTracksPage>(
        `/albums/${release.id}/tracks?market=${encodeURIComponent(market)}&limit=50`,
      );
      for (const t of page.items || []) {
        const artists = (t.artists || []).map((a) => ({ id: a.id || "", name: a.name }));
        added.push({
          id: t.id,
          spotifyId: t.id,
          uri: `spotify:track:${t.id}`,
          spotifyUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
          name: t.name,
          durationMs: t.duration_ms || 0,
          albumId: release.id,
          albumName: release.name,
          artists,
          targetArtistIsPrimary: artists[0]?.id === siteConfig.targetArtistId,
          containsTargetArtist: true,
          verified: true,
        });
      }
    } catch {
      // Tek bir sürümün parçaları alınamazsa sonraki yenilemede tekrar denenir.
    }
  }

  // filterVerifiedSingleTracks ana sanatçı / ID / URL kurallarını yeniden doğrular.
  return filterVerifiedSingleTracks([...base, ...added]);
}

export async function getVerifiedSingleTracks(): Promise<VerifiedSingleTrack[]> {
  try {
    const cached = unstable_cache(loadGeneratedSingleTracks, ["spotify-sehinsah-single-tracks-v1"], {
      revalidate: revalidateSeconds(),
      tags: ["spotify-sehinsah-single-tracks-v1"],
    });
    return await cached();
  } catch {
    return loadGeneratedSingleTracks();
  }
}
