import "server-only";

import { siteConfig } from "@/data/site";
import { buildMusicCatalog, dedupeAlbums } from "@/lib/spotify/normalize";
import type { MusicCatalog, SpotifyRelease } from "@/lib/spotify/types";

const DEEZER_ARTIST_ID = "10003428";
const MAX_PAGES = 4;

type DeezerAlbum = {
  id: number;
  title: string;
  link: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
  release_date?: string;
  record_type?: string;
  nb_tracks?: number;
  type?: string;
};

type DeezerAlbumsPage = {
  data: DeezerAlbum[];
  next?: string;
  total?: number;
};

function mapRecordType(recordType?: string): SpotifyRelease["albumType"] {
  const t = (recordType || "").toLowerCase();
  if (t === "album") return "album";
  if (t === "compile" || t === "compilation") return "compilation";
  return "single";
}

function toSpotifySearchUrl(title: string): string {
  const q = encodeURIComponent(`${title} ${siteConfig.displayName}`);
  return `https://open.spotify.com/intl-tr/search/${q}`;
}

function normalizeDeezerAlbum(raw: DeezerAlbum): SpotifyRelease {
  const releaseDate = raw.release_date || "";
  return {
    id: `deezer-${raw.id}`,
    name: raw.title,
    albumType: mapRecordType(raw.record_type),
    releaseDate,
    releaseYear: releaseDate.slice(0, 4),
    totalTracks: raw.nb_tracks || 0,
    imageUrl: raw.cover_xl || raw.cover_big || raw.cover_medium || null,
    spotifyUrl: toSpotifySearchUrl(raw.title),
    uri: `deezer:album:${raw.id}`,
    artists: [siteConfig.displayName],
  };
}

async function fetchDeezerPage(url: string): Promise<DeezerAlbumsPage> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SehinsahDijitalEvren/1.0 (catalog fallback)",
    },
    next: { revalidate: 21600 },
  });
  if (!res.ok) throw new Error(`DEEZER_${res.status}`);
  return (await res.json()) as DeezerAlbumsPage;
}

export async function getDeezerCatalog(): Promise<MusicCatalog> {
  const collected: DeezerAlbum[] = [];
  let next: string | null =
    `https://api.deezer.com/artist/${DEEZER_ARTIST_ID}/albums?limit=50`;
  let pages = 0;

  while (next && pages < MAX_PAGES) {
    const page = await fetchDeezerPage(next);
    collected.push(...(page.data || []));
    next = page.next || null;
    pages += 1;
  }

  const releases = dedupeAlbums(collected.map(normalizeDeezerAlbum));
  if (!releases.length) {
    throw new Error("DEEZER_EMPTY");
  }

  return buildMusicCatalog(releases, "live-cache");
}
