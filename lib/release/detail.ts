import "server-only";

import { unstable_cache } from "next/cache";
import detailsFile from "@/data/generated/release-details.json";
import { isGitHubPages } from "@/lib/deploy";
import { findVideoId, normalizeTitle } from "@/lib/youtube/match";
import { hasSpotifyCredentials, spotifyFetch } from "@/lib/spotify/server-client";
import { getVerifiedSingleTracks } from "@/lib/spotify/single-tracks";
import type { SpotifyRelease } from "@/lib/spotify/types";

export type ReleaseTrack = {
  id: string;
  name: string;
  trackNumber: number;
  durationMs: number;
  explicit: boolean;
  artists: Array<{ id: string; name: string }>;
  spotifyUrl: string;
  videoId: string | null;
};

export type ReleaseDetail = {
  release: SpotifyRelease;
  tracks: ReleaseTrack[];
  label: string | null;
  copyrights: string[];
  /** Sürüm genelinde oynatılacak klip (yoksa null → klipsiz kapak sahnesi). */
  videoId: string | null;
  source: "release-details-json" | "spotify-api" | "catalog-json";
};

type StoredTrack = Omit<ReleaseTrack, "videoId">;
type Part = { tracks: StoredTrack[]; label: string | null; copyrights: string[] };

type RawAlbumFull = {
  label?: string;
  copyrights?: Array<{ text: string; type: string }>;
  tracks?: {
    items: Array<{
      id: string;
      name: string;
      track_number: number;
      duration_ms: number;
      explicit?: boolean;
      artists: Array<{ id?: string; name: string }>;
      external_urls?: { spotify?: string };
    }>;
  };
};

/**
 * 1) data/generated/release-details.json (scripts/sync-release-details.mjs doldurur):
 *    sayfalar ziyaretçi başına Spotify'a gitmez, statik üretilir.
 * 2) JSON'da olmayan YENİ sürüm: API'den çek. Ardışık hata/429 sonrası 10 dk bekler
 *    (Spotify 429'da saatlerce engelleyebilir; ısrar etmemek önemli).
 * 3) Olmazsa: çalma kuyruğundaki parçalardan yedek.
 */
let apiCooldownUntil = 0;
const API_COOLDOWN_MS = 10 * 60_000;

/** JSON'daki kayıtlı parça listesi (senkron): statik sayfa parametreleri ve bağlantılar için. */
export function storedTracks(releaseId: string): Array<{ id: string; name: string }> {
  return fromStore(releaseId)?.tracks ?? [];
}

function fromStore(id: string): Part | null {
  const entry = (detailsFile as { details: Record<string, Part> }).details[id];
  return entry?.tracks?.length ? entry : null;
}

function fetchAlbumPart(id: string): Promise<Part> {
  const market = process.env.SPOTIFY_MARKET || "TR";
  return unstable_cache(
    async (): Promise<Part> => {
      const album = await spotifyFetch<RawAlbumFull>(
        `/albums/${id}?market=${encodeURIComponent(market)}`,
      );
      return {
        tracks: (album.tracks?.items ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          trackNumber: t.track_number,
          durationMs: t.duration_ms,
          explicit: Boolean(t.explicit),
          artists: (t.artists ?? []).map((a) => ({ id: a.id ?? "", name: a.name })),
          spotifyUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
        })),
        label: album.label ?? null,
        copyrights: [
          ...new Set(
            (album.copyrights ?? [])
              .filter((c) => c.text)
              .map((c) => (/^[©℗]/.test(c.text) ? c.text : `${c.type === "P" ? "℗" : "©"} ${c.text}`)),
          ),
        ],
      };
    },
    ["release-detail-v2", id],
    { revalidate: 60 * 60 * 24, tags: ["release-detail-v2"] },
  )();
}

async function fallbackPart(release: SpotifyRelease): Promise<Part> {
  const queue = await getVerifiedSingleTracks();
  return {
    tracks: queue
      .filter((t) => t.albumId === release.id)
      .map((t, i) => ({
        id: t.id,
        name: t.name,
        trackNumber: i + 1,
        durationMs: t.durationMs,
        explicit: false,
        artists: t.artists,
        spotifyUrl: t.spotifyUrl,
      })),
    label: null,
    copyrights: [],
  };
}

export async function getReleaseDetail(release: SpotifyRelease): Promise<ReleaseDetail> {
  let part = fromStore(release.id);
  let source: ReleaseDetail["source"] = "release-details-json";

  if (!part) {
    try {
      if (isGitHubPages() || !hasSpotifyCredentials() || Date.now() < apiCooldownUntil) {
        throw new Error("api_unavailable");
      }
      part = await fetchAlbumPart(release.id);
      if (!part.tracks.length) throw new Error("empty_tracks");
      source = "spotify-api";
    } catch (error) {
      if (!(error instanceof Error && error.message === "api_unavailable")) {
        apiCooldownUntil = Date.now() + API_COOLDOWN_MS;
      }
      part = await fallbackPart(release);
      source = "catalog-json";
    }
  }

  // Klip, ad eşleşmesine ek olarak parça süresi / sürüm tarihiyle doğrulanır (yanlış video çıkmasın).
  const tracks: ReleaseTrack[] = part.tracks.map((t) => ({
    ...t,
    videoId: findVideoId(t.name, [t.id], {
      durationMs: t.durationMs,
      releaseDate: release.releaseDate,
    }),
  }));
  const sameNameTrack = part.tracks.find(
    (t) => normalizeTitle(t.name) === normalizeTitle(release.name),
  );
  const releaseVideo =
    findVideoId(release.name, [release.id], {
      durationMs: sameNameTrack?.durationMs ?? (part.tracks.length === 1 ? part.tracks[0].durationMs : undefined),
      releaseDate: release.releaseDate,
    }) ??
    (tracks.length === 1 ? tracks[0].videoId : null) ??
    tracks.find((t) => t.videoId)?.videoId ??
    null;

  return {
    release,
    tracks,
    label: part.label,
    copyrights: part.copyrights,
    videoId: releaseVideo,
    source,
  };
}
