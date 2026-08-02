"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { siteConfig } from "@/data/site";

const SESSION_KEY = siteConfig.audioGate.sessionKey;

export type MusicGatePhase = "hidden" | "visible" | "starting" | "retry" | "closing";

export function useMusicStartGate() {
  const { ready, playFromUserGesture, subscribe, setUnlocked } = useSpotifyPlayback();
  // Visible on first client render so the gate is never lost to ready/remount races.
  const [phase, setPhase] = useState<MusicGatePhase>(() =>
    siteConfig.audioGate.enabled ? "visible" : "hidden",
  );
  const startingRef = useRef(false);
  const playbackLiveRef = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);

  const closeGate = useCallback(() => {
    setPhase("closing");
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setPhase("hidden");
      closeTimer.current = null;
    }, 360);
  }, []);

  useEffect(() => {
    if (!siteConfig.audioGate.enabled) {
      setPhase("hidden");
      return;
    }

    const unsub = subscribe((event) => {
      const live =
        (event.type === "started" || event.playing) && !event.isPaused && !event.isBuffering;
      if (!live) return;

      playbackLiveRef.current = true;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      startingRef.current = false;
      if (fallbackTimer.current != null) {
        window.clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }

      setPhase((current) => {
        if (current === "hidden" || current === "closing") return current;
        if (closeTimer.current == null) {
          closeTimer.current = window.setTimeout(() => {
            setPhase("hidden");
            closeTimer.current = null;
          }, 360);
        }
        return "closing";
      });
    });

    return () => {
      unsub();
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
      if (fallbackTimer.current != null) window.clearTimeout(fallbackTimer.current);
    };
  }, [subscribe, setUnlocked]);

  const handleStartExperience = useCallback(() => {
    if (startingRef.current) return;
    startingRef.current = true;
    setPhase("starting");

    // Must stay in the user-gesture call stack — no await / rAF / setTimeout before play().
    const ok = playFromUserGesture();
    if (!ok) {
      startingRef.current = false;
      setPhase("retry");
      return;
    }

    if (fallbackTimer.current != null) window.clearTimeout(fallbackTimer.current);
    fallbackTimer.current = window.setTimeout(() => {
      if (startingRef.current && !playbackLiveRef.current) {
        startingRef.current = false;
        setPhase("retry");
      }
      fallbackTimer.current = null;
    }, 1600);
  }, [playFromUserGesture]);

  const handleSilentContinue = useCallback(() => {
    startingRef.current = false;
    setUnlocked(false);
    closeGate();
  }, [closeGate, setUnlocked]);

  return {
    phase,
    ready,
    visible: phase === "visible" || phase === "starting" || phase === "retry" || phase === "closing",
    closing: phase === "closing",
    starting: phase === "starting",
    retry: phase === "retry",
    handleStartExperience,
    handleSilentContinue,
  };
}
