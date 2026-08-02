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
import { entropyConfig } from "@/data/entropy";
import { selectEntropySlots } from "@/data/entropy-slots";
import { useEntropySound } from "@/hooks/useEntropySound";
import {
  readCollectedIds,
  readCompleted,
  readEntropySeed,
  readVideoShown,
  resetEntropyStorage,
  writeCollectedIds,
  writeCompleted,
  writeVideoShown,
} from "@/lib/entropy/storage";
import type { EntropySlotId, EntropyToastState } from "@/lib/entropy/types";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { EntropyToast } from "@/components/easteregg/EntropyToast";
import { EntropyCompletionVideo } from "@/components/easteregg/EntropyCompletionVideo";

type Ctx = {
  enabled: boolean;
  total: number;
  activeSlotIds: EntropySlotId[];
  collectedIds: Set<EntropySlotId>;
  count: number;
  completed: boolean;
  videoOpen: boolean;
  toast: EntropyToastState;
  collect: (id: EntropySlotId) => void;
  isSlotVisible: (id: EntropySlotId) => boolean;
  openVideoReplay: () => void;
  closeVideo: () => void;
  registerVideoEl: (el: HTMLVideoElement | null) => void;
};

const EntropyContext = createContext<Ctx | null>(null);

export function EntropyProvider({ children }: { children: React.ReactNode }) {
  const { playCollect } = useEntropySound();
  const { playing, unlocked, pausePlayback, resumePlayback } = useSpotifyPlayback();
  const [seed, setSeed] = useState("ssr");
  const [collectedIds, setCollectedIds] = useState<EntropySlotId[]>([]);
  const [completed, setCompleted] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [toast, setToast] = useState<EntropyToastState>(null);
  const collectingRef = useRef(new Set<EntropySlotId>());
  const toastTimer = useRef<number | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const resumeSpotifyRef = useRef(false);
  const videoShownRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("resetEntropy")) {
        resetEntropyStorage();
      }
    }

    const nextSeed = readEntropySeed();
    setSeed(nextSeed);
    setCollectedIds(readCollectedIds());
    setCompleted(readCompleted());
    videoShownRef.current = readVideoShown();
  }, []);

  const activeSlotIds = useMemo(
    () => selectEntropySlots(seed, entropyConfig.total),
    [seed],
  );

  const collectedSet = useMemo(() => new Set(collectedIds), [collectedIds]);
  const count = collectedIds.length;

  const showToast = useCallback((nextCount: number) => {
    setToast({ count: nextCount, visible: true });
    if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
      toastTimer.current = null;
    }, entropyConfig.toastDurationMs);
  }, []);

  const registerVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
  }, []);

  const openVideo = useCallback(() => {
    writeVideoShown(true);
    videoShownRef.current = true;
    setVideoOpen(true);
  }, []);

  useEffect(() => {
    if (!videoOpen) return;

    resumeSpotifyRef.current = unlocked && playing;
    if (resumeSpotifyRef.current) {
      pausePlayback();
    }

    const timer = window.setTimeout(() => {
      const video = videoElRef.current;
      if (!video) return;
      video.muted = false;
      void video.play().catch(() => {
        /* overlay stays; play button handles retry */
      });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [videoOpen, pausePlayback, playing, unlocked]);

  const closeVideo = useCallback(() => {
    const video = videoElRef.current;
    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    setVideoOpen(false);
    if (resumeSpotifyRef.current && unlocked) {
      resumePlayback();
    }
    resumeSpotifyRef.current = false;
  }, [resumePlayback, unlocked]);

  const openVideoReplay = useCallback(() => {
    openVideo();
  }, [openVideo]);

  const collect = useCallback(
    (id: EntropySlotId) => {
      if (!entropyConfig.enabled) return;
      if (!activeSlotIds.includes(id)) return;
      if (collectedSet.has(id) || collectingRef.current.has(id)) return;

      collectingRef.current.add(id);
      playCollect();

      setCollectedIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        writeCollectedIds(next);
        const nextCount = next.length;
        showToast(nextCount);

        if (nextCount >= entropyConfig.total) {
          writeCompleted(true);
          setCompleted(true);
          window.setTimeout(() => {
            if (!videoShownRef.current) {
              openVideo();
            }
          }, 700);
        } else if (nextCount >= entropyConfig.total - 1) {
          // Warm video metadata near the end.
          const video = videoElRef.current;
          if (video) video.preload = "auto";
        }

        return next;
      });
    },
    [activeSlotIds, collectedSet, openVideo, playCollect, showToast],
  );

  const isSlotVisible = useCallback(
    (id: EntropySlotId) =>
      entropyConfig.enabled && activeSlotIds.includes(id) && !collectedSet.has(id),
    [activeSlotIds, collectedSet],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      enabled: entropyConfig.enabled,
      total: entropyConfig.total,
      activeSlotIds,
      collectedIds: collectedSet,
      count,
      completed,
      videoOpen,
      toast,
      collect,
      isSlotVisible,
      openVideoReplay,
      closeVideo,
      registerVideoEl,
    }),
    [
      activeSlotIds,
      collectedSet,
      count,
      completed,
      videoOpen,
      toast,
      collect,
      isSlotVisible,
      openVideoReplay,
      closeVideo,
      registerVideoEl,
    ],
  );

  return (
    <EntropyContext.Provider value={value}>
      {children}
      <EntropyToast />
      <EntropyCompletionVideo />
    </EntropyContext.Provider>
  );
}

export function useEntropy() {
  const ctx = useContext(EntropyContext);
  if (!ctx) throw new Error("useEntropy requires EntropyProvider");
  return ctx;
}
