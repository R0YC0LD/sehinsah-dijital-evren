"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { siteConfig } from "@/data/site";

const SESSION_KEY = siteConfig.audioGate.sessionKey;

export type MusicGatePhase = "hidden" | "visible" | "starting" | "retry" | "closing";

export function useMusicStartGate() {
  const {
    ready,
    playFromUserGesture,
    subscribe,
    setUnlocked,
    setGateOpen,
  } = useSpotifyPlayback();

  const [phase, setPhase] = useState<MusicGatePhase>(() =>
    siteConfig.audioGate.enabled ? "visible" : "hidden",
  );
  const startingRef = useRef(false);
  const playbackLiveRef = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const retryPlayTimer = useRef<number | null>(null);

  const closeGate = useCallback(() => {
    setPhase("closing");
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setPhase("hidden");
      setGateOpen(false);
      closeTimer.current = null;
    }, 360);
  }, [setGateOpen]);

  useEffect(() => {
    if (!siteConfig.audioGate.enabled) {
      setPhase("hidden");
      setGateOpen(false);
      return;
    }
    setGateOpen(phase === "visible" || phase === "starting" || phase === "retry");
  }, [phase, setGateOpen]);

  useEffect(() => {
    if (!siteConfig.audioGate.enabled) return;

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
      if (retryPlayTimer.current != null) {
        window.clearTimeout(retryPlayTimer.current);
        retryPlayTimer.current = null;
      }

      setPhase((current) => {
        if (current === "hidden" || current === "closing") return current;
        if (closeTimer.current == null) {
          closeTimer.current = window.setTimeout(() => {
            setPhase("hidden");
            setGateOpen(false);
            closeTimer.current = null;
          }, 280);
        }
        return "closing";
      });
    });

    return () => {
      unsub();
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
      if (fallbackTimer.current != null) window.clearTimeout(fallbackTimer.current);
      if (retryPlayTimer.current != null) window.clearTimeout(retryPlayTimer.current);
    };
  }, [subscribe, setUnlocked, setGateOpen]);

  const handleStartExperience = useCallback(() => {
    if (startingRef.current) return;
    startingRef.current = true;
    setPhase("starting");

    // Keep play() inside the user-gesture call stack.
    const ok = playFromUserGesture();

    if (!ok) {
      // Controller not ready yet — keep trying briefly, then allow another tap.
      let attempts = 0;
      if (retryPlayTimer.current != null) window.clearTimeout(retryPlayTimer.current);
      const tick = () => {
        attempts += 1;
        const again = playFromUserGesture();
        if (again || playbackLiveRef.current) {
          setUnlocked(true);
          // Optimistic close: Spotify often starts without a reliable started event.
          fallbackTimer.current = window.setTimeout(() => {
            if (!playbackLiveRef.current) {
              playFromUserGesture();
            }
            startingRef.current = false;
            closeGate();
          }, 900);
          return;
        }
        if (attempts < 8) {
          retryPlayTimer.current = window.setTimeout(tick, 180);
          return;
        }
        startingRef.current = false;
        setPhase("retry");
      };
      retryPlayTimer.current = window.setTimeout(tick, 120);
      return;
    }

    setUnlocked(true);

    // Extra play bursts while still close to the gesture (helps flaky embeds).
    window.setTimeout(() => playFromUserGesture(), 120);
    window.setTimeout(() => playFromUserGesture(), 320);

    if (fallbackTimer.current != null) window.clearTimeout(fallbackTimer.current);
    // Don't trap the user: close after a short wait even if Spotify is silent about events.
    fallbackTimer.current = window.setTimeout(() => {
      startingRef.current = false;
      if (!playbackLiveRef.current) {
        playFromUserGesture();
      }
      closeGate();
      fallbackTimer.current = null;
    }, 1100);
  }, [playFromUserGesture, setUnlocked, closeGate]);

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
