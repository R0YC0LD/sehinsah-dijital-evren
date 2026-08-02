import { siteConfig } from "@/data/site";
import type { SpotifyRelease, SpotifyTrack } from "@/lib/spotify/types";

const ARTIST_ID = siteConfig.targetArtistId;

function extractObjectId(url: string, kind: "album" | "track" | "artist"): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const kindIndex = parts.findIndex((p) => p === kind);
    if (kindIndex === -1 || !parts[kindIndex + 1]) return null;
    return parts[kindIndex + 1].split("?")[0];
  } catch {
    return null;
  }
}

export function isSpotifySearchUrl(url: string): boolean {
  if (!url) return true;
  return (
    url.includes("/search/") ||
    url.includes("spotify:search:") ||
    url.includes("?query=") ||
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?search\//i.test(url)
  );
}

export function isDirectSpotifyAlbumUrl(url: string, expectedId: string): boolean {
  if (isSpotifySearchUrl(url)) return false;
  const id = extractObjectId(url, "album");
  return Boolean(id && id === expectedId);
}

export function isDirectSpotifyTrackUrl(url: string, expectedId: string): boolean {
  if (isSpotifySearchUrl(url)) return false;
  const id = extractObjectId(url, "track");
  return Boolean(id && id === expectedId);
}

export function isDirectSpotifyArtistUrl(url: string, expectedId = ARTIST_ID): boolean {
  if (isSpotifySearchUrl(url)) return false;
  const id = extractObjectId(url, "artist");
  return Boolean(id && id === expectedId);
}

export function validateSpotifyRelease(release: SpotifyRelease): boolean {
  if (!release?.id || !release.spotifyUrl) return false;
  if (isSpotifySearchUrl(release.spotifyUrl)) return false;
  if (!isDirectSpotifyAlbumUrl(release.spotifyUrl, release.spotifyId || release.id)) return false;
  if (!release.containsTargetArtist) return false;
  return release.verified !== false;
}

export function validateSpotifyTrack(track: SpotifyTrack): boolean {
  if (!track?.id || !track.spotifyUrl) return false;
  if (isSpotifySearchUrl(track.spotifyUrl)) return false;
  if (!isDirectSpotifyTrackUrl(track.spotifyUrl, track.spotifyId || track.id)) return false;
  if (!track.containsTargetArtist) return false;
  return track.verified !== false;
}
