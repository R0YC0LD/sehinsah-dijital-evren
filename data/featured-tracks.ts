export type FeaturedTrack = {
  id: string;
  title: string;
  releaseTitle?: string;
  spotifyUrl: string;
  coverUrl?: string;
  previewSrc?: string;
  previewStart?: number;
  previewDuration?: number;
};

/**
 * Optional short preview clips.
 * Place licensed files under public/audio/previews/ and set previewSrc.
 * Without previewSrc the row shows "ÖNİZLEME YOK" and still links to Spotify.
 *
 * When Spotify catalog is available, MusicSection may enrich titles/covers
 * from latest releases automatically for empty slots.
 */
export const featuredTracks: FeaturedTrack[] = [
  {
    id: "1",
    title: "Şehinşah",
    spotifyUrl: "https://open.spotify.com/intl-tr/artist/0FUsrstJwmg4WVHQMTYuUA",
  },
];
