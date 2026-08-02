import { siteConfig } from "@/data/site";
import type {
  MusicCatalog,
  SpotifyArtistRef,
  SpotifyImage,
  SpotifyRawAlbum,
  SpotifyRelease,
  SpotifyTrack,
  VerifiedSingleTrack,
} from "./types";
import { isDirectSpotifyAlbumUrl, isSpotifySearchUrl } from "./validate-links";

const TARGET = siteConfig.targetArtistId;

/** Emergency denylist — primary gate remains exact artist ID. */
const TITLE_DENYLIST = [
  "kader çıkmazı",
  "kamuran akkor",
  "samanyolu",
];

export function isDeniedReleaseTitle(name = ""): boolean {
  const n = name.toLowerCase();
  return TITLE_DENYLIST.some((d) => n.includes(d));
}

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
    // Legacy string-only artists are unverified — never invent IDs.
    return (artists as string[]).map((name) => ({ id: "", name }));
  }
  return (artists as Array<{ id?: string; name: string }>).map((a) => ({
    id: a.id || "",
    name: a.name,
  }));
}

export function containsTargetArtist(artists: SpotifyArtistRef[]): boolean {
  return artists.some((a) => a.id === TARGET);
}

export function normalizeAlbum(raw: SpotifyRawAlbum): SpotifyRelease {
  const artists = normalizeArtists(raw.artists);
  const spotifyUrl = raw.external_urls?.spotify || `https://open.spotify.com/album/${raw.id}`;
  const hasTarget = containsTargetArtist(artists);
  const verified =
    Boolean(raw.id) &&
    !isSpotifySearchUrl(spotifyUrl) &&
    isDirectSpotifyAlbumUrl(spotifyUrl, raw.id) &&
    hasTarget &&
    !isDeniedReleaseTitle(raw.name);

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

/**
 * Re-validate generated JSON. Never trust stored verified flags.
 * Artist ID must be present and exact — name matching / defaults are rejected.
 */
export function coerceRelease(
  raw: Partial<SpotifyRelease> & { id: string; name: string },
): SpotifyRelease | null {
  const id = raw.spotifyId || raw.id;
  if (!id || id.startsWith("deezer-")) return null;
  if (isDeniedReleaseTitle(raw.name)) return null;

  const spotifyUrl =
    raw.spotifyUrl && !isSpotifySearchUrl(raw.spotifyUrl)
      ? raw.spotifyUrl
      : `https://open.spotify.com/album/${id}`;

  if (!isDirectSpotifyAlbumUrl(spotifyUrl, id)) return null;

  const artists = normalizeArtists(
    (raw.artists as Array<{ id?: string; name: string }> | string[] | undefined) || [],
  );

  const hasTarget = containsTargetArtist(artists);
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
    artists,
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

export function filterVerifiedSingleTracks(
  tracks: VerifiedSingleTrack[] = [],
): VerifiedSingleTrack[] {
  const byId = new Map<string, VerifiedSingleTrack>();
  for (const t of tracks) {
    if (!t?.id) continue;
    if (isDeniedReleaseTitle(t.name) || isDeniedReleaseTitle(t.albumName)) continue;
    if (!t.verified || !t.containsTargetArtist || !t.targetArtistIsPrimary) continue;
    if (!containsTargetArtist(t.artists)) continue;
    if (t.artists[0]?.id !== TARGET) continue;
    if (t.uri !== `spotify:track:${t.id}`) continue;
    if (!t.spotifyUrl || isSpotifySearchUrl(t.spotifyUrl)) continue;
    if (!t.spotifyUrl.includes(`/track/${t.id}`)) continue;
    byId.set(t.id, {
      ...t,
      spotifyId: t.spotifyId || t.id,
      uri: `spotify:track:${t.id}`,
      containsTargetArtist: true,
      verified: true,
      targetArtistIsPrimary: true,
    });
  }
  return [...byId.values()];
}

export function buildMusicCatalog(
  releases: SpotifyRelease[],
  source: MusicCatalog["source"],
  updatedAt: string | null = new Date().toISOString(),
  tracks: SpotifyTrack[] = [],
  verifiedSingleTracks: VerifiedSingleTrack[] = [],
): MusicCatalog {
  const verified = releases.filter(
    (r) =>
      r.verified &&
      r.containsTargetArtist &&
      containsTargetArtist(r.artists) &&
      !isDeniedReleaseTitle(r.name),
  );
  const sorted = [...verified].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const albums = sorted.filter((r) => isAlbumType(r.albumType));
  const singles = sorted.filter((r) => isSingleType(r.albumType));
  const verifiedTracks = tracks.filter(
    (t) =>
      t.verified &&
      t.containsTargetArtist &&
      containsTargetArtist(t.artists) &&
      !isDeniedReleaseTitle(t.name),
  );
  const singlesQueue = filterVerifiedSingleTracks(verifiedSingleTracks);

  return {
    releases: sorted,
    albums,
    singles,
    tracks: verifiedTracks,
    verifiedSingleTracks: singlesQueue,
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
  return buildMusicCatalog([], source, null, [], []);
}

export function splitCatalog(albums: SpotifyRelease[]) {
  return {
    albums: albums.filter((a) => isAlbumType(a.albumType)),
    singles: albums.filter((a) => isSingleType(a.albumType)),
  };
}
