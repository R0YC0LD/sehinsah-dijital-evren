"use client";

import { useEffect, useRef, useState } from "react";
import { VideoLoaderFallback } from "@/components/loading/VideoLoaderFallback";
import { useVideoLoadingIntro } from "@/components/loading/useVideoLoadingIntro";
import { registerGsap } from "@/lib/gsap/register";
import { assetPath } from "@/lib/paths/assetPath";
import styles from "./VideoLoadingScreen.module.css";

type Segment = { from: number; to: number; playbackRate: number };

function pickSegment(segments: Segment[], t: number): Segment {
  return (
    segments.find((s) => t >= s.from && t < s.to) ||
    segments[segments.length - 1]
  );
}

export function VideoLoadingScreen() {
  const { active, reduced, saveData, complete, config, setPhase } =
    useVideoLoadingIntro();
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startedAt = useRef(0);
  const done = useRef(false);
  const segmentIdx = useRef(-1);
  const rafCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active || done.current) return;
    startedAt.current = performance.now();

    const finish = () => {
      if (done.current) return;
      done.current = true;
      setPhase("exiting");
      setExiting(true);
      rafCleanup.current?.();
      rafCleanup.current = null;

      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
        } catch {
          /* ignore */
        }
      }

      const { gsap, ScrollTrigger } = registerGsap();
      const el = overlayRef.current;
      if (!el) {
        complete();
        requestAnimationFrame(() => ScrollTrigger.refresh());
        return;
      }

      gsap.to(el, {
        clipPath: "inset(0 0 0 110%)",
        opacity: 0,
        duration: config.exitDuration,
        ease: "power2.inOut",
        onComplete: () => {
          complete();
          if (video) {
            video.removeAttribute("src");
            video.load();
          }
          requestAnimationFrame(() => ScrollTrigger.refresh());
        },
      });
    };

    const maxMs = saveData ? 1200 : reduced ? 700 : config.maxVisibleMs;
    const minMs = reduced || saveData ? 250 : config.minVisibleMs;
    const hardTimer = window.setTimeout(finish, maxMs);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        const elapsed = performance.now() - startedAt.current;
        if (elapsed >= maxMs) finish();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    if (reduced || saveData) {
      setUseFallback(true);
      setPhase("playing-finale");
      const t = window.setTimeout(finish, Math.min(maxMs, reduced ? 400 : 1100));
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(hardTimer);
        document.removeEventListener("visibilitychange", onVis);
      };
    }

    const video = videoRef.current;
    if (!video) {
      setUseFallback(true);
      const t = window.setTimeout(finish, 900);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(hardTimer);
        document.removeEventListener("visibilitychange", onVis);
      };
    }

    video.muted = true;
    video.volume = 0;
    video.defaultMuted = true;
    video.playsInline = true;

    const segments = (config.loaderSegments || []) as Segment[];
    const startTime = config.startTime ?? 0.05;
    const finaleTime = config.finaleTime ?? 9.65;

    const applyRate = () => {
      if (!video || done.current) return;
      const seg = pickSegment(segments, video.currentTime);
      const idx = segments.indexOf(seg);
      if (idx !== segmentIdx.current) {
        segmentIdx.current = idx;
        video.playbackRate = seg.playbackRate;
        if (idx === 0) setPhase("playing-intro");
        else if (idx === 1) setPhase("playing-fill");
        else setPhase("playing-finale");
      }
      if (video.currentTime >= finaleTime) {
        const elapsed = performance.now() - startedAt.current;
        if (elapsed >= minMs) finish();
      }
    };

    const onCanPlay = () => {
      if (done.current) return;
      try {
        video.currentTime = startTime;
      } catch {
        /* ignore */
      }
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          setUseFallback(true);
          window.setTimeout(finish, 800);
        });
      }
    };

    const canPlayTimer = window.setTimeout(() => {
      if (video.readyState < 2) {
        setUseFallback(true);
        window.setTimeout(finish, 700);
      }
    }, config.canPlayTimeoutMs);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadeddata", onCanPlay);

    let rvfcId = 0;
    const anyVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };

    if (typeof anyVideo.requestVideoFrameCallback === "function") {
      const tick = () => {
        applyRate();
        if (!done.current) {
          rvfcId = anyVideo.requestVideoFrameCallback!(tick);
        }
      };
      rvfcId = anyVideo.requestVideoFrameCallback(tick);
      rafCleanup.current = () => anyVideo.cancelVideoFrameCallback?.(rvfcId);
    } else {
      const onTime = () => applyRate();
      video.addEventListener("timeupdate", onTime);
      rafCleanup.current = () => video.removeEventListener("timeupdate", onTime);
    }

    return () => {
      window.clearTimeout(hardTimer);
      window.clearTimeout(canPlayTimer);
      document.removeEventListener("visibilitychange", onVis);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadeddata", onCanPlay);
      rafCleanup.current?.();
      rafCleanup.current = null;
    };
  }, [active, reduced, saveData, complete, config, setPhase]);

  if (!active) return null;

  const poster = assetPath("/media/loading/sehinsah-entropi-loader-poster.webp");
  const mobileMp4 = assetPath("/media/loading/sehinsah-entropi-loader-mobile.mp4");
  const desktopMp4 = assetPath("/media/loading/sehinsah-entropi-loader.mp4");
  const webm = assetPath("/media/loading/sehinsah-entropi-loader.webm");

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${exiting ? styles.exiting : ""}`}
      aria-hidden="true"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <div className={styles.loaderFrame}>
        {!useFallback ? (
          <video
            ref={videoRef}
            className={styles.video}
            muted
            playsInline
            autoPlay
            preload="auto"
            poster={poster}
            disablePictureInPicture
            controls={false}
            aria-hidden="true"
          >
            {!saveData ? (
              <source src={webm} type="video/webm" />
            ) : null}
            <source
              src={mobileMp4}
              type="video/mp4"
              media="(max-width: 899px)"
            />
            <source src={desktopMp4} type="video/mp4" />
          </video>
        ) : (
          <VideoLoaderFallback visible reduced={reduced} />
        )}
      </div>
    </div>
  );
}
