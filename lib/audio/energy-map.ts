export type TrackEnergyMap = {
  trackId: string;
  durationMs: number;
  frames: Array<{
    timeMs: number;
    bass: number;
    kick: number;
    energy: number;
  }>;
};

export type RhythmFallback = {
  bpm: number;
  offsetMs: number;
  kickPattern: number[];
  bassEnvelope: number;
};

const DEFAULT_FALLBACK: RhythmFallback = {
  bpm: 92,
  offsetMs: 140,
  kickPattern: [1, 0, 0.55, 0],
  bassEnvelope: 0.38,
};

export const trackRhythmFallbacks: Record<string, RhythmFallback> = {
  "0flGs6oE7iHhDnnynJ4mV5": {
    bpm: 95,
    offsetMs: 120,
    kickPattern: [1, 0, 0.6, 0],
    bassEnvelope: 0.42,
  },
  "5gxVxiJ0hOwbPiFduw5M3O": {
    bpm: 88,
    offsetMs: 160,
    kickPattern: [1, 0, 0.5, 0],
    bassEnvelope: 0.36,
  },
  "77XRjnZN6DAdcWlILhauTm": {
    bpm: 102,
    offsetMs: 100,
    kickPattern: [1, 0.2, 0.7, 0],
    bassEnvelope: 0.44,
  },
  "4r9HNQZLxMhQJtoNaFFrGr": {
    bpm: 90,
    offsetMs: 140,
    kickPattern: [1, 0, 0.55, 0],
    bassEnvelope: 0.4,
  },
  "0AYg0HCbxjwP0sT8IXOZyT": {
    bpm: 96,
    offsetMs: 130,
    kickPattern: [1, 0, 0.58, 0.1],
    bassEnvelope: 0.41,
  },
  "3UOyVyApCP7vGVuIsPxnZp": {
    bpm: 84,
    offsetMs: 150,
    kickPattern: [1, 0, 0.48, 0],
    bassEnvelope: 0.34,
  },
  "0bvsV2THvrNj9tQm0yvfTn": {
    bpm: 92,
    offsetMs: 140,
    kickPattern: [1, 0, 0.55, 0],
    bassEnvelope: 0.38,
  },
  "3riHsraRxIFfLLy7n3T8mq": {
    bpm: 98,
    offsetMs: 110,
    kickPattern: [1, 0.15, 0.62, 0],
    bassEnvelope: 0.4,
  },
  "0uTmb3dc18w4Ues60lkhXZ": {
    bpm: 110,
    offsetMs: 90,
    kickPattern: [1, 0, 0.7, 0],
    bassEnvelope: 0.46,
  },
  "0stSrcHk2lZdjp03JpP6A2": {
    bpm: 86,
    offsetMs: 150,
    kickPattern: [1, 0, 0.5, 0],
    bassEnvelope: 0.35,
  },
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function getRhythmFallback(trackId: string): RhythmFallback {
  return trackRhythmFallbacks[trackId] || DEFAULT_FALLBACK;
}

/** Continuous equalizer frames from BPM/kick pattern — not heartbeat pulses. */
export function buildBpmEnergyMap(
  trackId: string,
  durationMs: number,
  fallback = getRhythmFallback(trackId),
): TrackEnergyMap {
  const end = durationMs > 0 ? durationMs : 240000;
  const beatMs = 60000 / Math.max(40, fallback.bpm);
  const pattern = fallback.kickPattern.length ? fallback.kickPattern : DEFAULT_FALLBACK.kickPattern;
  const stepMs = beatMs / pattern.length;
  const frameStep = 60;
  const frames: TrackEnergyMap["frames"] = [];

  for (let t = 0; t <= end; t += frameStep) {
    if (t < fallback.offsetMs) {
      frames.push({ timeMs: t, bass: 0.08, kick: 0, energy: 0.08 });
      continue;
    }

    const rel = t - fallback.offsetMs;
    const beatPhase = (rel % beatMs) / beatMs;
    const stepFloat = (rel % beatMs) / stepMs;
    const stepIndex = Math.floor(stepFloat) % pattern.length;
    const stepPos = stepFloat - Math.floor(stepFloat);
    const hit = pattern[stepIndex] ?? 0;

    // Kick as short transient within each pattern step — not a double heartbeat.
    const kick = clamp01(hit * Math.exp(-stepPos * 7.2));

    // Bass breathes smoothly across the beat + rides a bit on kick body.
    const breath =
      fallback.bassEnvelope *
      (0.42 + 0.58 * (0.5 + 0.5 * Math.sin(beatPhase * Math.PI * 2 - Math.PI / 2)));
    const bass = clamp01(breath + kick * 0.28);
    const energy = clamp01(bass * 0.72 + kick * 0.45);

    frames.push({
      timeMs: t,
      bass,
      kick,
      energy,
    });
  }

  return { trackId, durationMs: end, frames };
}

export function findEnergyFrameIndex(
  frames: TrackEnergyMap["frames"],
  positionMs: number,
) {
  let lo = 0;
  let hi = frames.length - 1;
  if (hi < 0) return 0;
  if (positionMs <= frames[0].timeMs) return 0;
  if (positionMs >= frames[hi].timeMs) return hi;

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid].timeMs <= positionMs) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function sampleEnergyAt(map: TrackEnergyMap, positionMs: number) {
  const frames = map.frames;
  if (!frames.length) {
    return { bass: 0, kick: 0, energy: 0 };
  }

  const i = findEnergyFrameIndex(frames, positionMs);
  const current = frames[i];
  const next = frames[i + 1] || current;
  const span = Math.max(1, next.timeMs - current.timeMs);
  const t = Math.min(1, Math.max(0, (positionMs - current.timeMs) / span));

  return {
    bass: current.bass + (next.bass - current.bass) * t,
    kick: current.kick + (next.kick - current.kick) * t,
    energy: current.energy + (next.energy - current.energy) * t,
  };
}
