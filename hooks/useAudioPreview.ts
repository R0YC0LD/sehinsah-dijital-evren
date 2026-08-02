"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/data/site";

const STORAGE_KEY = "sehinsah-audio-preview-enabled";

export function useAudioPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current != null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const stopPreview = useCallback(() => {
    clearStopTimer();
    const audio = audioRef.current;
    if (!audio) {
      setActiveId(null);
      return;
    }
    const fade = () => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      setActiveId(null);
    };

    try {
      const start = audio.volume;
      const steps = 4;
      let i = 0;
      const tick = () => {
        i += 1;
        audio.volume = Math.max(0, start * (1 - i / steps));
        if (i >= steps) fade();
        else window.setTimeout(tick, 25);
      };
      if (!audio.paused && start > 0) tick();
      else fade();
    } catch {
      fade();
    }
  }, [clearStopTimer]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setEnabled(true);
    } catch {
      /* ignore */
    }
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      clearStopTimer();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [clearStopTimer]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopPreview();
    };
    window.addEventListener("blur", stopPreview);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", stopPreview);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stopPreview]);

  const enable = useCallback(() => {
    setEnabled(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const playPreview = useCallback(
    async (id: string, src?: string, duration = siteConfig.audioPreview.defaultDuration) => {
      if (!enabled || !src || !audioRef.current) return false;
      const audio = audioRef.current;
      const clamped = Math.min(
        Math.max(duration, siteConfig.audioPreview.minDuration),
        siteConfig.audioPreview.maxDuration,
      );

      clearStopTimer();

      try {
        const absolute = new URL(src, window.location.href).href;
        if (audio.src !== absolute) audio.src = src;
        audio.volume = 1;
        audio.currentTime = 0;
        setActiveId(id);
        await audio.play();
        stopTimerRef.current = window.setTimeout(() => {
          if (!audio.paused) stopPreview();
        }, clamped * 1000);
        return true;
      } catch {
        setActiveId(null);
        return false;
      }
    },
    [enabled, clearStopTimer, stopPreview],
  );

  return { enabled, enable, activeId, playPreview, stopPreview };
}
