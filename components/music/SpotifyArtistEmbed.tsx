"use client";

import { RandomSpotifyPlayer } from "@/components/music/RandomSpotifyPlayer";
import type { VerifiedSingleTrack } from "@/lib/spotify/types";

type Props = {
  tracks?: VerifiedSingleTrack[];
  /** Parça ID → sitedeki parça/yayın sayfası. */
  pageHrefs?: Record<string, string>;
};

export function SpotifyArtistEmbed({ tracks = [], pageHrefs = {} }: Props) {
  return <RandomSpotifyPlayer tracks={tracks} pageHrefs={pageHrefs} />;
}
