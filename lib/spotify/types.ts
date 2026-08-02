export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyArtistRef = {
  id: string;
  name: string;
};

export type SpotifyRawAlbum = {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  uri: string;
  artists: SpotifyArtistRef[];
};

export type SpotifyRelease = {
  id: string;
  spotifyId: string;
  objectType: "album";
  name: string;
  albumType: "album" | "single" | "compilation" | string;
  releaseDate: string;
  releaseYear: string;
  totalTracks: number;
  imageUrl: string | null;
  spotifyUrl: string;
  uri: string;
  artists: SpotifyArtistRef[];
  containsTargetArtist: boolean;
  verified: boolean;
};

export type SpotifyTrack = {
  id: string;
  spotifyId: string;
  objectType: "track";
  name: string;
  trackNumber: number;
  durationMs: number;
  explicit: boolean;
  spotifyUrl: string;
  uri: string;
  imageUrl: string | null;
  albumId: string;
  albumName: string;
  artists: SpotifyArtistRef[];
  containsTargetArtist: boolean;
  verified: boolean;
};

export type VerifiedSingleTrack = {
  id: string;
  spotifyId: string;
  uri: `spotify:track:${string}`;
  spotifyUrl: string;
  name: string;
  durationMs: number;
  albumId: string;
  albumName: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  targetArtistIsPrimary: boolean;
  containsTargetArtist: true;
  verified: true;
};

export type MusicCatalog = {
  releases: SpotifyRelease[];
  albums: SpotifyRelease[];
  singles: SpotifyRelease[];
  tracks: SpotifyTrack[];
  verifiedSingleTracks: VerifiedSingleTrack[];
  latestRelease: SpotifyRelease | null;
  counts: {
    total: number;
    albums: number;
    singles: number;
    tracks: number;
  };
  updatedAt: string | null;
  source: "live-cache" | "generated-json" | "fallback";
};

/** @deprecated use SpotifyRelease */
export type NormalizedAlbum = SpotifyRelease;
