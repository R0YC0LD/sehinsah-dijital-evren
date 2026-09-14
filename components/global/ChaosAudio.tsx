"use client";

import { useEffect, useRef } from "react";
import { useAudioPreviewContext } from "@/components/providers/AudioPreviewProvider";
import { useChaos } from "@/components/providers/ChaosProvider";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { assetPath } from "@/lib/paths/assetPath";

const TRACK_SRC = "/audio/chaos/chaos-cathedral.mp3";
const VOLUME = 0.55;

export function ChaosAudio() {
  const { chaos } = useChaos();
  const { pausePlayback } = useSpotifyPlayback();
  const { stopPreview } = useAudioPreviewContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.loop = true;
    audio.volume = VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (chaos) {
      pausePlayback();
      stopPreview();
      if (!audio.src) audio.src = assetPath(TRACK_SRC);
      audio.currentTime = 0;
      audio.play().catch(() => {
        /* blocked without a gesture — the chaos toggle click itself is one */
      });
    } else {
      audio.pause();
    }
  }, [chaos, pausePlayback, stopPreview]);

  return null;
}
