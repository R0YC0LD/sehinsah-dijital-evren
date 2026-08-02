export type PlaybackClockState = {
  trackUri: string;
  trackId: string;
  positionMs: number;
  durationMs: number;
  isPaused: boolean;
  isBuffering: boolean;
  receivedAt: number;
};

export function createPlaybackClock() {
  let last: PlaybackClockState | null = null;

  return {
    update(next: Omit<PlaybackClockState, "receivedAt"> & { receivedAt?: number }) {
      last = {
        ...next,
        receivedAt: next.receivedAt ?? performance.now(),
      };
      return last;
    },
    estimate(now = performance.now()) {
      if (!last) return null;
      if (last.isPaused || last.isBuffering) return last.positionMs;
      return last.positionMs + (now - last.receivedAt);
    },
    get() {
      return last;
    },
    reset() {
      last = null;
    },
  };
}

export type PlaybackClock = ReturnType<typeof createPlaybackClock>;
