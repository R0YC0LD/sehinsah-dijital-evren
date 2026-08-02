/**
 * Exact Spotify track IDs only.
 * Never invent IDs or point to artist/search URLs.
 *
 * Optional licensed preview clips:
 * public/audio/previews/... + previewSrc
 */
export type FeaturedTrackConfig = {
  spotifyTrackId: string;
  previewSrc?: string;
  previewStart?: number;
  previewDuration?: number;
};

/** @deprecated use FeaturedTrackConfig — kept for row rendering shape */
export type FeaturedTrack = {
  id: string;
  title: string;
  releaseTitle?: string;
  spotifyUrl: string;
  coverUrl?: string;
  previewSrc?: string;
  previewStart?: number;
  previewDuration?: number;
  verified?: boolean;
};

/**
 * Add exact track IDs when available from Spotify API.
 * Leave empty to hide placeholder rows and keep the artist embed.
 */
export const featuredTrackIds: FeaturedTrackConfig[] = [];

/** @deprecated empty by design — no artist-page placeholders */
export const featuredTracks: FeaturedTrack[] = [];
