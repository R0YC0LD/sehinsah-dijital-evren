"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SpotifyEmbedController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: Record<string, unknown> }) => void) => void;
  removeListener: (event: string, cb: (e: { data: Record<string, unknown> }) => void) => void;
};

export type PlaybackEvent = {
  trackUri: string;
  trackId: string;
  positionMs: number;
  durationMs: number;
  isPaused: boolean;
  isBuffering: boolean;
  playing: boolean;
  type: "update" | "started" | "ready" | "stopped";
};

type Listener = (event: PlaybackEvent) => void;

type Ctx = {
  ready: boolean;
  playing: boolean;
  unlocked: boolean;
  registerController: (controller: SpotifyEmbedController | null) => void;
  setReady: (ready: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
  playFromUserGesture: () => boolean;
  pausePlayback: () => boolean;
  resumePlayback: () => boolean;
  emit: (event: PlaybackEvent) => void;
  subscribe: (listener: Listener) => () => void;
};

const SpotifyPlaybackContext = createContext<Ctx | null>(null);

const IFRAME_API = "https://open.spotify.com/embed/iframe-api/v1";
const SCRIPT_FLAG = "__sehinsahSpotifyIframeApiLoading";

declare global {
  interface Window {
    [SCRIPT_FLAG]?: boolean;
  }
}

export function SpotifyPlaybackProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const listeners = useRef(new Set<Listener>());
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Preload Spotify iframe API early so the gate is not stuck on HAZIRLANIYOR.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector(`script[src="${IFRAME_API}"]`)) return;
    if (window[SCRIPT_FLAG]) return;
    window[SCRIPT_FLAG] = true;
    const script = document.createElement("script");
    script.src = IFRAME_API;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const registerController = useCallback((controller: SpotifyEmbedController | null) => {
    controllerRef.current = controller;
    if (!controller) setReady(false);
  }, []);

  const playFromUserGesture = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return false;
    try {
      controller.play();
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const pausePlayback = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return false;
    try {
      controller.pause();
      setPlaying(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resumePlayback = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return false;
    try {
      controller.resume?.();
      controller.play();
      setPlaying(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const emit = useCallback((event: PlaybackEvent) => {
    if (event.playing) setPlaying(true);
    if (event.isPaused) setPlaying(false);
    if (event.type === "started") {
      setPlaying(true);
      setUnlocked(true);
    }
    listeners.current.forEach((fn) => fn(event));
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      playing,
      unlocked,
      registerController,
      setReady,
      setPlaying,
      setUnlocked,
      playFromUserGesture,
      pausePlayback,
      resumePlayback,
      emit,
      subscribe,
    }),
    [
      ready,
      playing,
      unlocked,
      registerController,
      playFromUserGesture,
      pausePlayback,
      resumePlayback,
      emit,
      subscribe,
    ],
  );

  return (
    <SpotifyPlaybackContext.Provider value={value}>
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}

export function useSpotifyPlayback() {
  const ctx = useContext(SpotifyPlaybackContext);
  if (!ctx) throw new Error("useSpotifyPlayback requires provider");
  return ctx;
}
