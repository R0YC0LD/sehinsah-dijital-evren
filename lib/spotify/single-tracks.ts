import "server-only";

import { unstable_cache } from "next/cache";
import { siteConfig } from "@/data/site";
import { filterVerifiedSingleTracks } from "@/lib/spotify/normalize";
import type { VerifiedSingleTrack } from "@/lib/spotify/types";

function revalidateSeconds() {
  const raw = Number(process.env.SPOTIFY_REVALIDATE_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

async function loadGeneratedSingleTracks(): Promise<VerifiedSingleTrack[]> {
  try {
    const data = (await import("@/data/generated/spotify-single-tracks.json")).default as {
      tracks?: VerifiedSingleTrack[];
      targetArtistId?: string;
      schemaVersion?: number;
    };
    if (data.targetArtistId && data.targetArtistId !== siteConfig.targetArtistId) {
      return [];
    }
    return filterVerifiedSingleTracks(data.tracks || []);
  } catch {
    return [];
  }
}

export async function getVerifiedSingleTracks(): Promise<VerifiedSingleTrack[]> {
  try {
    const cached = unstable_cache(loadGeneratedSingleTracks, ["spotify-sehinsah-single-tracks-v1"], {
      revalidate: revalidateSeconds(),
      tags: ["spotify-sehinsah-single-tracks-v1"],
    });
    return await cached();
  } catch {
    return loadGeneratedSingleTracks();
  }
}
