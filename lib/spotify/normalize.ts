import type { MusicCatalog, SpotifyImage, SpotifyRawAlbum, SpotifyRelease } from "./types";

function pickImage(images: SpotifyImage[]): string | null {
  if (!images?.length) return null;
  const preferred = images.find((img) => (img.width ?? 0) >= 500 && (img.width ?? 0) <= 700);
  return preferred?.url || images[0]?.url || null;
}

function releaseYear(date: string, precision: string): string {
  if (!date) return "";
  if (precision === "year") return date.slice(0, 4);
  return date.slice(0, 4);
}

export function normalizeAlbum(raw: SpotifyRawAlbum): SpotifyRelease {
  return {
    id: raw.id,
    name: raw.name,
    albumType: raw.album_type,
    releaseDate: raw.release_date,
    releaseYear: releaseYear(raw.release_date, raw.release_date_precision),
    totalTracks: raw.total_tracks,
    imageUrl: pickImage(raw.images),
    spotifyUrl: raw.external_urls.spotify,
    uri: raw.uri,
    artists: raw.artists.map((a) => a.name),
  };
}

function baseTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[\(\[]\s*(deluxe|remaster(?:ed)?|live|expanded|anniversary).*?[\)\]]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeAlbums(albums: SpotifyRelease[]): SpotifyRelease[] {
  const byId = new Map<string, SpotifyRelease>();
  for (const album of albums) {
    if (!byId.has(album.id)) byId.set(album.id, album);
  }

  const result: SpotifyRelease[] = [];
  const seen = new Set<string>();

  for (const album of byId.values()) {
    const softKey = `${album.name.toLowerCase()}::${album.releaseYear}`;
    const key = `${baseTitle(album.name)}::${album.releaseYear}::${album.albumType}`;
    if (seen.has(softKey) || seen.has(key)) continue;
    seen.add(softKey);
    seen.add(key);
    result.push(album);
  }

  return result.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

function isAlbumType(type: string) {
  return type === "album" || type === "compilation";
}

function isSingleType(type: string) {
  return type === "single" || type === "ep";
}

export function buildMusicCatalog(
  releases: SpotifyRelease[],
  source: MusicCatalog["source"],
  updatedAt: string | null = new Date().toISOString(),
): MusicCatalog {
  const sorted = [...releases].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const albums = sorted.filter((r) => isAlbumType(r.albumType));
  const singles = sorted.filter((r) => isSingleType(r.albumType));

  return {
    releases: sorted,
    albums,
    singles,
    latestRelease: sorted[0] ?? null,
    counts: {
      total: sorted.length,
      albums: albums.length,
      singles: singles.length,
    },
    updatedAt,
    source,
  };
}

export function emptyCatalog(source: MusicCatalog["source"] = "fallback"): MusicCatalog {
  return buildMusicCatalog([], source, null);
}

export function splitCatalog(albums: SpotifyRelease[]) {
  return {
    albums: albums.filter((a) => a.albumType === "album"),
    singles: albums.filter((a) => a.albumType === "single"),
  };
}
