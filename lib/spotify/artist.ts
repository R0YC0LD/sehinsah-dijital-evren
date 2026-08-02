import "server-only";

import { unstable_cache } from "next/cache";
import { siteConfig } from "@/data/site";
import { hasSpotifyCredentials, spotifyFetch } from "./client";
import { dedupeAlbums, normalizeAlbum, splitCatalog } from "./normalize";
import type { SpotifyCatalog, SpotifyRawAlbum } from "./types";

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

async function loadCatalog(): Promise<SpotifyCatalog> {
  if (!hasSpotifyCredentials()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[spotify] Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
    }
    return {
      albums: [],
      singles: [],
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
    };
  }

  const artistId = siteConfig.spotify.artistId;
  const market = process.env.SPOTIFY_MARKET || "TR";
  const raw = await fetchAllAlbums(artistId, market);
  const normalized = dedupeAlbums(raw.map(normalizeAlbum));
  const { albums, singles } = splitCatalog(normalized);

  return {
    albums,
    singles,
    fetchedAt: new Date().toISOString(),
    source: "api",
  };
}

function revalidateSeconds() {
  const raw = Number(process.env.SPOTIFY_REVALIDATE_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

export async function getSpotifyCatalog(): Promise<SpotifyCatalog> {
  try {
    const cached = unstable_cache(loadCatalog, ["spotify-sehinsah-catalog"], {
      revalidate: revalidateSeconds(),
      tags: ["spotify-sehinsah-catalog"],
    });
    return await cached();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[spotify] catalog fetch failed", error);
    }
    return {
      albums: [],
      singles: [],
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
    };
  }
}
