import type { TrackEnergyMap } from "@/lib/audio/energy-map";

/**
 * Optional loaders for offline-authored energy maps (no audio payloads).
 * Keys are Spotify track IDs.
 */
export const energyMapLoaders: Record<
  string,
  () => Promise<{ default: TrackEnergyMap }>
> = {};

/** @deprecated Use energyMapLoaders — kept empty for old imports. */
export const beatMapLoaders = energyMapLoaders;

export async function loadEnergyMap(trackId: string): Promise<TrackEnergyMap | null> {
  const loader = energyMapLoaders[trackId];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}

/** @deprecated Use loadEnergyMap */
export const loadBeatMap = loadEnergyMap;
