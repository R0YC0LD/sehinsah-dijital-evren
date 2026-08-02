import type { TrackBeatMap } from "@/lib/audio/beat-map";

/**
 * Optional loaders for offline-authored beat maps.
 * Keys are Spotify track IDs. Values return JSON without audio.
 */
export const beatMapLoaders: Record<string, () => Promise<{ default: TrackBeatMap }>> = {};

export async function loadBeatMap(trackId: string): Promise<TrackBeatMap | null> {
  const loader = beatMapLoaders[trackId];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}
