"use client";

import { useCallback, useEffect, useRef } from "react";
import { entropyConfig } from "@/data/entropy";
import { assetPath } from "@/lib/paths/assetPath";

export function useEntropySound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(assetPath(entropyConfig.collectSoundSrc));
    audio.preload = "auto";
    audio.volume = entropyConfig.collectVolume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playCollect = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => {
        /* easter egg continues without sound */
      });
    } catch {
      /* ignore */
    }
  }, []);

  return { playCollect };
}
