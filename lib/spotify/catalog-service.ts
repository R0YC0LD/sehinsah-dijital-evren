import "server-only";

import { unstable_cache } from "next/cache";
import { siteConfig } from "@/data/site";
import { isVercelRuntime } from "@/lib/deploy";
import { getDeezerCatalog } from "@/lib/spotify/deezer-catalog";
import { hasSpotifyCredentials, spotifyFetch } from "@/lib/spotify/server-client";
import { buildMusicCatalog, dedupeAlbums, emptyCatalog, normalizeAlbum } from "@/lib/spotify/normalize";
import type { MusicCatalog, SpotifyRawAlbum } from "@/lib/spotify/types";

type AlbumsPage = {
  items: SpotifyRawAlbum[];
  next: string | null;
};

const MAX_PAGES = 4;

async function fetchAllAlbums(artistId: string, market: string): Promise<SpotifyRawAlbum[]> {
  const collected: SpotifyRawAlbum[] = [];
  let nextPath: string | null =
    `/artists/${artistId}/albums?include_groups=album,single&market=${encodeURIComponent(market)}&limit=50`;
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

async function loadLiveCatalog(): Promise<MusicCatalog> {
  if (hasSpotifyCredentials()) {
    const artistId = siteConfig.spotify.artistId;
    const market = process.env.SPOTIFY_MARKET || "TR";
    const raw = await fetchAllAlbums(artistId, market);
    const releases = dedupeAlbums(raw.map(normalizeAlbum));
    return buildMusicCatalog(releases, "live-cache");
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[catalog] Spotify credentials missing — using Deezer live catalog");
  }

  return getDeezerCatalog();
}

function revalidateSeconds() {
  const raw = Number(process.env.SPOTIFY_REVALIDATE_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

async function getLiveCachedSpotifyCatalog(): Promise<MusicCatalog> {
  try {
    const cached = unstable_cache(loadLiveCatalog, ["spotify-sehinsah-catalog"], {
      revalidate: revalidateSeconds(),
      tags: ["spotify-sehinsah-catalog"],
    });
    return await cached();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[catalog] live catalog failed", error);
    }
    try {
      return await getDeezerCatalog();
    } catch {
      return getGeneratedSpotifyCatalog();
    }
  }
}

export async function getGeneratedSpotifyCatalog(): Promise<MusicCatalog> {
  try {
    const data = (await import("@/data/generated/spotify-catalog.json")).default as MusicCatalog;
    if (!data?.releases?.length) return emptyCatalog("fallback");
    return {
      ...data,
      source: "generated-json",
    };
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

/** Back-compat for older imports */
export async function getSpotifyCatalog() {
  const catalog = await getMusicCatalog();
  return {
    albums: catalog.albums,
    singles: catalog.singles,
    fetchedAt: catalog.updatedAt || new Date().toISOString(),
    source: catalog.source === "live-cache" ? ("api" as const) : ("unavailable" as const),
  };
}
