import "server-only";

import { unstable_cache } from "next/cache";
import { siteConfig } from "@/data/site";
import { isVercelRuntime } from "@/lib/deploy";
import { hasSpotifyCredentials, spotifyFetch } from "@/lib/spotify/server-client";
import {
  buildMusicCatalog,
  coerceRelease,
  dedupeAlbums,
  emptyCatalog,
  normalizeAlbum,
} from "@/lib/spotify/normalize";
import {
  getVerifiedSingleTracks,
  getVerifiedSingleTracksWithLive,
} from "@/lib/spotify/single-tracks";
import type { MusicCatalog, SpotifyRawAlbum, SpotifyRelease, SpotifyTrack } from "@/lib/spotify/types";

type AlbumsPage = {
  items: SpotifyRawAlbum[];
  next: string | null;
};

const MAX_PAGES = 20;
const ALBUMS_PAGE_LIMIT = 10;

async function fetchAllAlbums(artistId: string, market: string): Promise<SpotifyRawAlbum[]> {
  const collected: SpotifyRawAlbum[] = [];
  let nextPath: string | null =
    `/artists/${artistId}/albums?include_groups=album,single&market=${encodeURIComponent(market)}&limit=${ALBUMS_PAGE_LIMIT}`;
  let pages = 0;

  while (nextPath && pages < MAX_PAGES) {
    const requestPath: string = nextPath;
    const page: AlbumsPage = await spotifyFetch<AlbumsPage>(requestPath);
    collected.push(...(page.items || []));
    pages += 1;

    if (page.next) {
      const url = new URL(page.next);
      nextPath = `${url.pathname.replace("/v1", "")}${url.search}`;
    } else {
      nextPath = null;
    }
  }

  return collected;
}

/**
 * Önbelleksiz, taze doğrulanmış sürüm listesi (yeni sürüm bildirimi tespiti için).
 * Kimlik bilgisi yoksa boş döner.
 */
export async function fetchFreshReleases(): Promise<SpotifyRelease[]> {
  if (!hasSpotifyCredentials()) return [];
  const raw = await fetchAllAlbums(siteConfig.spotify.artistId, process.env.SPOTIFY_MARKET || "TR");
  return dedupeAlbums(raw.map(normalizeAlbum).filter((r) => r.verified));
}

/**
 * Build sırasında onlarca sayfa aynı anda kataloğu ister; her biri ~10 sayfalık
 * Spotify isteği yapınca 429 (rate limit) alınıp JSON'a düşülüyordu. Aynı süreçteki
 * çağrılar tek isteği paylaşır; başarısız olursa kısa süre tekrar denenmez
 * (Spotify 429'da Retry-After saatlerce sürebilir, ısrar etmek süreyi uzatır).
 */
let liveShared: { at: number; ok: boolean; promise: Promise<MusicCatalog> } | null = null;
const LIVE_SHARE_MS = 60_000;
const LIVE_FAIL_COOLDOWN_MS = 5 * 60_000;

function loadLiveCatalog(): Promise<MusicCatalog> {
  if (liveShared) {
    const age = Date.now() - liveShared.at;
    if (age < (liveShared.ok ? LIVE_SHARE_MS : LIVE_FAIL_COOLDOWN_MS)) {
      return liveShared.promise;
    }
  }
  const entry = { at: Date.now(), ok: true, promise: fetchLiveCatalog() };
  entry.promise.catch(() => {
    entry.ok = false;
  });
  liveShared = entry;
  return entry.promise;
}

async function fetchLiveCatalog(): Promise<MusicCatalog> {
  if (!hasSpotifyCredentials()) {
    return getGeneratedSpotifyCatalog();
  }

  const artistId = siteConfig.spotify.artistId;
  const market = process.env.SPOTIFY_MARKET || "TR";
  const raw = await fetchAllAlbums(artistId, market);
  const releases = dedupeAlbums(raw.map(normalizeAlbum).filter((r) => r.verified));
  const verifiedSingleTracks = await getVerifiedSingleTracksWithLive(releases);
  return buildMusicCatalog(releases, "live-cache", new Date().toISOString(), [], verifiedSingleTracks);
}

function revalidateSeconds() {
  const raw = Number(process.env.SPOTIFY_REVALIDATE_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

async function getLiveCachedSpotifyCatalog(): Promise<MusicCatalog> {
  try {
    const cached = unstable_cache(loadLiveCatalog, ["spotify-sehinsah-catalog-v5"], {
      revalidate: revalidateSeconds(),
      tags: ["spotify-sehinsah-catalog-v5"],
    });
    return await cached();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[catalog] live catalog failed", error);
    }
    return getGeneratedSpotifyCatalog();
  }
}

export async function getGeneratedSpotifyCatalog(): Promise<MusicCatalog> {
  try {
    const data = (await import("@/data/generated/spotify-catalog.json")).default as unknown as {
      releases: Array<Record<string, unknown>>;
      tracks?: SpotifyTrack[];
      schemaVersion?: number;
      targetArtistId?: string;
      source?: string;
      updatedAt?: string | null;
      generatedAt?: string;
    };

    if (data.targetArtistId && data.targetArtistId !== siteConfig.targetArtistId) {
      return emptyCatalog("fallback");
    }
    if (data.schemaVersion != null && Number(data.schemaVersion) < 4) {
      return emptyCatalog("fallback");
    }

    const releases = (data.releases || [])
      .map((r) =>
        coerceRelease(
          r as Parameters<typeof coerceRelease>[0],
        ),
      )
      .filter(Boolean);
    const tracks = ((data.tracks || []) as SpotifyTrack[]).filter(
      (t) =>
        t?.verified &&
        t.containsTargetArtist &&
        Array.isArray(t.artists) &&
        t.artists.some((a) => a.id === siteConfig.targetArtistId) &&
        !String(t.spotifyUrl || "").includes("/search/"),
    );

    if (!releases.length) return emptyCatalog("fallback");
    const verifiedSingleTracks = await getVerifiedSingleTracks();
    return buildMusicCatalog(
      releases as NonNullable<ReturnType<typeof coerceRelease>>[],
      "generated-json",
      data.updatedAt || data.generatedAt || null,
      tracks,
      verifiedSingleTracks,
    );
  } catch {
    return emptyCatalog("fallback");
  }
}

export async function getMusicCatalog(): Promise<MusicCatalog> {
  if (isVercelRuntime()) {
    return getLiveCachedSpotifyCatalog();
  }
  return getGeneratedSpotifyCatalog();
}

export async function getSpotifyCatalog() {
  const catalog = await getMusicCatalog();
  return {
    albums: catalog.albums,
    singles: catalog.singles,
    fetchedAt: catalog.updatedAt || new Date().toISOString(),
    source: catalog.source === "live-cache" ? ("api" as const) : ("unavailable" as const),
  };
}
