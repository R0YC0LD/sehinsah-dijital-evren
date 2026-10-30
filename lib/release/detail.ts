import "server-only";

import { unstable_cache } from "next/cache";
import { findVideoId } from "@/lib/youtube/match";
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
  source: "spotify-api" | "catalog-json";
};

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

type ApiPart = Pick<ReleaseDetail, "tracks" | "label" | "copyrights">;

/** Albüm detayı yavaş değişir: 24 saat cache. API hata verirse cache'lenmez, fallback kullanılır. */
function fetchAlbumPart(id: string): Promise<ApiPart> {
  const market = process.env.SPOTIFY_MARKET || "TR";
  return unstable_cache(
    async (): Promise<ApiPart> => {
      const album = await spotifyFetch<RawAlbumFull>(
        `/albums/${id}?market=${encodeURIComponent(market)}`,
      );
      const tracks: ReleaseTrack[] = (album.tracks?.items ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        trackNumber: t.track_number,
        durationMs: t.duration_ms,
        explicit: Boolean(t.explicit),
        artists: (t.artists ?? []).map((a) => ({ id: a.id ?? "", name: a.name })),
        spotifyUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
        videoId: null,
      }));
      return {
        tracks,
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
    ["release-detail-v1", id],
    { revalidate: 60 * 60 * 24, tags: ["release-detail-v1"] },
  )();
}

/** API yoksa/başarısızsa: JSON'daki çalma kuyruğu parçalarından kurulan yedek. */
async function fallbackPart(release: SpotifyRelease): Promise<ApiPart> {
  const queue = await getVerifiedSingleTracks();
  const tracks: ReleaseTrack[] = queue
    .filter((t) => t.albumId === release.id)
    .map((t, i) => ({
      id: t.id,
      name: t.name,
      trackNumber: i + 1,
      durationMs: t.durationMs,
      explicit: false,
      artists: t.artists,
      spotifyUrl: t.spotifyUrl,
      videoId: null,
    }));
  return { tracks, label: null, copyrights: [] };
}

export async function getReleaseDetail(release: SpotifyRelease): Promise<ReleaseDetail> {
  let part: ApiPart;
  let source: ReleaseDetail["source"] = "spotify-api";

  try {
    if (!hasSpotifyCredentials()) throw new Error("no_credentials");
    part = await fetchAlbumPart(release.id);
    if (!part.tracks.length) throw new Error("empty_tracks");
  } catch {
    part = await fallbackPart(release);
    source = "catalog-json";
  }

  const tracks = part.tracks.map((t) => ({ ...t, videoId: findVideoId(t.name, [t.id]) }));
  const releaseVideo =
    findVideoId(release.name, [release.id]) ??
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
