"use client";

import { RandomSpotifyPlayer } from "@/components/music/RandomSpotifyPlayer";
import type { VerifiedSingleTrack } from "@/lib/spotify/types";

type Props = {
  tracks?: VerifiedSingleTrack[];
};

export function SpotifyArtistEmbed({ tracks = [] }: Props) {
  return <RandomSpotifyPlayer tracks={tracks} />;
}
