import type { NormalizedAlbum, SpotifyImage, SpotifyRawAlbum } from "./types";

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

export function normalizeAlbum(raw: SpotifyRawAlbum): NormalizedAlbum {
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

export function dedupeAlbums(albums: NormalizedAlbum[]): NormalizedAlbum[] {
  const byId = new Map<string, NormalizedAlbum>();
  for (const album of albums) {
    if (!byId.has(album.id)) byId.set(album.id, album);
  }

  const result: NormalizedAlbum[] = [];
  const seen = new Set<string>();

  for (const album of byId.values()) {
    const key = `${baseTitle(album.name)}::${album.releaseYear}::${album.albumType}`;
    // Keep distinct editions that still differ after soft strip
    const softKey = `${album.name.toLowerCase()}::${album.releaseYear}`;
    if (seen.has(softKey) || seen.has(key)) continue;
    seen.add(softKey);
    seen.add(key);
    result.push(album);
  }

  return result.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

export function splitCatalog(albums: NormalizedAlbum[]) {
  const albumsOnly = albums.filter((a) => a.albumType === "album");
  const singles = albums.filter((a) => a.albumType === "single");
  return { albums: albumsOnly, singles };
}
