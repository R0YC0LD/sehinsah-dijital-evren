export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
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
  artists: Array<{ id: string; name: string }>;
};

export type NormalizedAlbum = {
  id: string;
  name: string;
  albumType: "album" | "single" | "compilation" | string;
  releaseDate: string;
  releaseYear: string;
  totalTracks: number;
  imageUrl: string | null;
  spotifyUrl: string;
  uri: string;
  artists: string[];
};

export type SpotifyCatalog = {
  albums: NormalizedAlbum[];
  singles: NormalizedAlbum[];
  fetchedAt: string;
  source: "api" | "unavailable";
};
