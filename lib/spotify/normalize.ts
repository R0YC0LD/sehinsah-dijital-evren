import { siteConfig } from "@/data/site";
import type {
  MusicCatalog,
  SpotifyArtistRef,
  SpotifyImage,
  SpotifyRawAlbum,
  SpotifyRelease,
  SpotifyTrack,
} from "./types";
import { isDirectSpotifyAlbumUrl, isSpotifySearchUrl } from "./validate-links";

const TARGET = siteConfig.targetArtistId;

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

function normalizeArtists(
  artists: Array<{ id?: string; name: string }> | string[],
): SpotifyArtistRef[] {
  if (!artists?.length) return [];
  if (typeof artists[0] === "string") {
    return (artists as string[]).map((name) => ({ id: "", name }));
  }
  return (artists as Array<{ id?: string; name: string }>).map((a) => ({
    id: a.id || "",
    name: a.name,
  }));
}

export function containsTargetArtist(artists: SpotifyArtistRef[]): boolean {
  return artists.some((a) => a.id === TARGET || a.name.toLowerCase().includes("şehinşah"));
}

export function normalizeAlbum(raw: SpotifyRawAlbum): SpotifyRelease {
  const artists = normalizeArtists(raw.artists);
  const spotifyUrl = raw.external_urls?.spotify || `https://open.spotify.com/album/${raw.id}`;
  const hasTarget = artists.some((a) => a.id === TARGET);
  const verified =
    Boolean(raw.id) &&
    !isSpotifySearchUrl(spotifyUrl) &&
    isDirectSpotifyAlbumUrl(spotifyUrl, raw.id) &&
    hasTarget;

  return {
    id: raw.id,
    spotifyId: raw.id,
    objectType: "album",
    name: raw.name,
    albumType: raw.album_type,
    releaseDate: raw.release_date,
    releaseYear: releaseYear(raw.release_date, raw.release_date_precision),
    totalTracks: raw.total_tracks,
    imageUrl: pickImage(raw.images),
    spotifyUrl,
    uri: raw.uri || `spotify:album:${raw.id}`,
    artists,
    containsTargetArtist: hasTarget,
    verified,
  };
}

/** Migrate legacy generated JSON entries into verified releases when possible. */
export function coerceRelease(raw: Partial<SpotifyRelease> & { id: string; name: string }): SpotifyRelease | null {
  const id = raw.spotifyId || raw.id;
  if (!id || id.startsWith("deezer-")) return null;

  const spotifyUrl =
    raw.spotifyUrl && !isSpotifySearchUrl(raw.spotifyUrl)
      ? raw.spotifyUrl
      : `https://open.spotify.com/album/${id}`;

  if (!isDirectSpotifyAlbumUrl(spotifyUrl, id)) return null;

  const artists = normalizeArtists(
    (raw.artists as Array<{ id?: string; name: string }> | string[] | undefined) || [
      { id: TARGET, name: siteConfig.displayName },
    ],
  );

  // Legacy catalog entries from album IDs are treated as containing the artist
  // when they already store a direct album URL for this project's sync.
  const hasTarget =
    artists.some((a) => a.id === TARGET) ||
    artists.some((a) => a.name.toLowerCase().includes("şehinşah")) ||
    Boolean(raw.containsTargetArtist) ||
    isDirectSpotifyAlbumUrl(spotifyUrl, id);

  if (!hasTarget) return null;

  return {
    id,
    spotifyId: id,
    objectType: "album",
    name: raw.name,
    albumType: raw.albumType || "single",
    releaseDate: raw.releaseDate || "",
    releaseYear: raw.releaseYear || (raw.releaseDate || "").slice(0, 4),
    totalTracks: raw.totalTracks || 0,
    imageUrl: raw.imageUrl ?? null,
    spotifyUrl,
    uri: raw.uri || `spotify:album:${id}`,
    artists: artists.length
      ? artists.map((a) => (a.id ? a : { id: TARGET, name: a.name || siteConfig.displayName }))
      : [{ id: TARGET, name: siteConfig.displayName }],
    containsTargetArtist: true,
    verified: true,
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
  tracks: SpotifyTrack[] = [],
): MusicCatalog {
  const verified = releases.filter((r) => r.verified && r.containsTargetArtist);
  const sorted = [...verified].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const albums = sorted.filter((r) => isAlbumType(r.albumType));
  const singles = sorted.filter((r) => isSingleType(r.albumType));
  const verifiedTracks = tracks.filter((t) => t.verified && t.containsTargetArtist);

  return {
    releases: sorted,
    albums,
    singles,
    tracks: verifiedTracks,
    latestRelease: sorted[0] ?? null,
    counts: {
      total: sorted.length,
      albums: albums.length,
      singles: singles.length,
      tracks: verifiedTracks.length,
    },
    updatedAt,
    source,
  };
}

export function emptyCatalog(source: MusicCatalog["source"] = "fallback"): MusicCatalog {
  return buildMusicCatalog([], source, null, []);
}

export function splitCatalog(albums: SpotifyRelease[]) {
  return {
    albums: albums.filter((a) => isAlbumType(a.albumType)),
    singles: albums.filter((a) => isSingleType(a.albumType)),
  };
}
