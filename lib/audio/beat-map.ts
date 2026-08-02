export type TrackBeatMap = {
  trackId: string;
  durationMs: number;
  bpm: number;
  offsetMs: number;
  beats: Array<{
    timeMs: number;
    strength: number;
    type: "primary" | "secondary";
  }>;
};

export type RhythmFallback = {
  bpm: number;
  offsetMs: number;
  subdivision: number;
};

const DEFAULT_FALLBACK: RhythmFallback = {
  bpm: 92,
  offsetMs: 140,
  subdivision: 1,
};

/** Optional per-track BPM when no beat JSON exists. */
export const trackRhythmFallbacks: Record<string, RhythmFallback> = {
  "0flGs6oE7iHhDnnynJ4mV5": { bpm: 95, offsetMs: 120, subdivision: 1 },
  "5gxVxiJ0hOwbPiFduw5M3O": { bpm: 88, offsetMs: 160, subdivision: 1 },
  "77XRjnZN6DAdcWlILhauTm": { bpm: 102, offsetMs: 100, subdivision: 1 },
  "4r9HNQZLxMhQJtoNaFFrGr": { bpm: 90, offsetMs: 140, subdivision: 1 },
  "0AYg0HCbxjwP0sT8IXOZyT": { bpm: 96, offsetMs: 130, subdivision: 1 },
  "3UOyVyApCP7vGVuIsPxnZp": { bpm: 84, offsetMs: 150, subdivision: 1 },
  "0bvsV2THvrNj9tQm0yvfTn": { bpm: 92, offsetMs: 140, subdivision: 1 },
  "3riHsraRxIFfLLy7n3T8mq": { bpm: 98, offsetMs: 110, subdivision: 1 },
  "0uTmb3dc18w4Ues60lkhXZ": { bpm: 110, offsetMs: 90, subdivision: 1 },
  "0stSrcHk2lZdjp03JpP6A2": { bpm: 86, offsetMs: 150, subdivision: 1 },
};

export function getRhythmFallback(trackId: string): RhythmFallback {
  return trackRhythmFallbacks[trackId] || DEFAULT_FALLBACK;
}

export function buildBpmBeatMap(
  trackId: string,
  durationMs: number,
  fallback = getRhythmFallback(trackId),
): TrackBeatMap {
  const interval = 60000 / Math.max(40, fallback.bpm);
  const step = interval * Math.max(1, fallback.subdivision);
  const beats: TrackBeatMap["beats"] = [];
  const end = durationMs > 0 ? durationMs : 240000;

  for (let t = fallback.offsetMs, i = 0; t < end; t += step, i += 1) {
    beats.push({
      timeMs: Math.round(t),
      strength: i % 4 === 0 ? 0.92 : i % 2 === 0 ? 0.72 : 0.48,
      type: i % 2 === 0 ? "primary" : "secondary",
    });
  }

  return {
    trackId,
    durationMs: end,
    bpm: fallback.bpm,
    offsetMs: fallback.offsetMs,
    beats,
  };
}

export function findBeatIndex(beats: TrackBeatMap["beats"], positionMs: number) {
  let lo = 0;
  let hi = beats.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid].timeMs <= positionMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
