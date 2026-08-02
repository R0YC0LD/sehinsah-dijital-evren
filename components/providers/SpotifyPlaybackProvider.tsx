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
  gateOpen: boolean;
  hostElement: HTMLElement | null;
  registerController: (controller: SpotifyEmbedController | null) => void;
  registerHostElement: (el: HTMLElement | null) => void;
  setReady: (ready: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
  setGateOpen: (open: boolean) => void;
  setCurrentUri: (uri: string | null) => void;
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
  const currentUriRef = useRef<string | null>(null);
  const listeners = useRef(new Set<Listener>());
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [hostElement, setHostElement] = useState<HTMLElement | null>(null);

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

  const registerHostElement = useCallback((el: HTMLElement | null) => {
    setHostElement(el);
  }, []);

  const setCurrentUri = useCallback((uri: string | null) => {
    currentUriRef.current = uri;
  }, []);

  const playFromUserGesture = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return false;

    const uri = currentUriRef.current;
    let attempted = false;

    const tryCall = (fn: () => void) => {
      try {
        fn();
        attempted = true;
      } catch {
        /* continue */
      }
    };

    // Aggressive start sequence inside the same user-gesture stack.
    tryCall(() => controller.play());
    tryCall(() => controller.resume());
    if (uri) {
      tryCall(() => controller.loadUri(uri));
      tryCall(() => controller.play());
      tryCall(() => controller.resume());
    }
    tryCall(() => controller.play());

    if (!attempted) return false;
    setUnlocked(true);
    return true;
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
    if (event.trackUri) currentUriRef.current = event.trackUri;
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
      gateOpen,
      hostElement,
      registerController,
      registerHostElement,
      setReady,
      setPlaying,
      setUnlocked,
      setGateOpen,
      setCurrentUri,
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
      gateOpen,
      hostElement,
      registerController,
      registerHostElement,
      setCurrentUri,
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
