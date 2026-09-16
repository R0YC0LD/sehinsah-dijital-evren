"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  buildBpmEnergyMap,
  sampleEnergyAt,
  type TrackEnergyMap,
} from "@/lib/audio/energy-map";
import { createPlaybackClock } from "@/lib/audio/playback-clock";
import { loadEnergyMap } from "@/data/audio-analysis";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { siteConfig } from "@/data/site";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function compressEnergy(value: number) {
  const v = clamp(value, 0, 1);
  if (v < 0.65) return v;
  return 0.65 + (v - 0.65) * 0.45;
}

function trackIdFromUri(uri: string) {
  const parts = uri.split(":");
  return parts[parts.length - 1] || "";
}

function lowPowerMode() {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData) || (navigator.hardwareConcurrency || 8) <= 4;
}

function smoothToward(
  current: number,
  target: number,
  dtMs: number,
  attackMs: number,
  releaseMs: number,
) {
  const tau = target > current ? attackMs : releaseMs;
  const alpha = 1 - Math.exp(-dtMs / Math.max(1, tau));
  return current + (target - current) * alpha;
}

/**
 * Continuous bass/kick equalizer scale on the inner wrapper.
 * No heartbeat / double-pulse timelines.
 */
export function useCharacterAudioPulse(
  audioReactiveRef: React.RefObject<HTMLElement | null>,
) {
  const { subscribe, unlocked } = useSpotifyPlayback();
  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;

  useEffect(() => {
    if (!siteConfig.audioPulse.enabled) return;

    const clock = createPlaybackClock();
    let map: TrackEnergyMap | null = null;
    let activeTrackId = "";
    let raf = 0;
    let destroyed = false;
    let lastFrameAt = performance.now();
    let smoothedBass = 0;
    let smoothedKick = 0;
    let prevKickSample = 0;
    let currentScaleX = 1;
    let currentScaleY = 1;
    let returningToNeutral = false;
    let debugEl: HTMLDivElement | null = null;
    let lastRafMs = 0;

    const mobileMq = window.matchMedia("(max-width: 899px)");
    const tabletMq = window.matchMedia("(max-width: 1199px)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const computeTier = (): "mobile" | "tablet" | "desktop" =>
      mobileMq.matches ? "mobile" : tabletMq.matches ? "tablet" : "desktop";

    let cachedTier = computeTier();
    let cachedReduced = reducedMq.matches;

    const debug =
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("audioDebug");

    if (debug) {
      debugEl = document.createElement("div");
      debugEl.style.cssText =
        "position:fixed;left:8px;bottom:8px;z-index:1200;padding:8px 10px;font:11px/1.35 monospace;background:rgba(0,0,0,.72);color:#9ff;pointer-events:none;max-width:280px";
      document.body.appendChild(debugEl);
    }

    let setScaleX: ((v: number) => void) | null = null;
    let setScaleY: ((v: number) => void) | null = null;

    const bindSetters = () => {
      const el = audioReactiveRef.current;
      if (!el) return false;
      setScaleX = gsap.quickSetter(el, "scaleX") as (v: number) => void;
      setScaleY = gsap.quickSetter(el, "scaleY") as (v: number) => void;
      return true;
    };

    const resetVisual = (animate = true) => {
      returningToNeutral = true;
      smoothedBass = 0;
      smoothedKick = 0;
      prevKickSample = 0;
      const el = audioReactiveRef.current;
      if (!el) return;
      if (!animate) {
        currentScaleX = 1;
        currentScaleY = 1;
        setScaleX?.(1);
        setScaleY?.(1);
        el.style.removeProperty("--audio-brightness");
        el.style.removeProperty("--audio-contrast");
        el.style.removeProperty("--audio-glow-blur");
        el.style.removeProperty("--audio-glow-opacity");
        el.style.willChange = "auto";
        returningToNeutral = false;
        return;
      }
      gsap.to(el, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          currentScaleX = Number(gsap.getProperty(el, "scaleX")) || 1;
          currentScaleY = Number(gsap.getProperty(el, "scaleY")) || 1;
        },
        onComplete: () => {
          currentScaleX = 1;
          currentScaleY = 1;
          returningToNeutral = false;
          el.style.removeProperty("--audio-brightness");
          el.style.removeProperty("--audio-contrast");
          el.style.removeProperty("--audio-glow-blur");
          el.style.removeProperty("--audio-glow-opacity");
          el.style.willChange = "auto";
        },
      });
    };

    const ensureMap = async (trackId: string, durationMs: number) => {
      if (!trackId || trackId === activeTrackId) return;
      activeTrackId = trackId;
      smoothedBass = 0;
      smoothedKick = 0;
      prevKickSample = 0;
      const authored = await loadEnergyMap(trackId);
      if (destroyed) return;
      map = authored || buildBpmEnergyMap(trackId, durationMs);
    };

    const tick = (now: number) => {
      if (destroyed || cachedReduced) return;

      const lowPower = lowPowerMode();
      const minFrameMs = lowPower ? 33 : 0;
      if (minFrameMs && now - lastRafMs < minFrameMs) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastRafMs = now;

      const dtMs = clamp(now - lastFrameAt, 0, 48);
      lastFrameAt = now;

      if (!setScaleX || !setScaleY) bindSetters();

      const state = clock.get();
      const el = audioReactiveRef.current;
      const active =
        Boolean(state) &&
        unlockedRef.current &&
        Boolean(map) &&
        !state!.isPaused &&
        !state!.isBuffering &&
        !returningToNeutral;

      if (!active || !el || !setScaleX || !setScaleY) {
        if (debugEl && state) {
          debugEl.textContent = `idle · ${state.trackId}\nscale ${currentScaleX.toFixed(3)}/${currentScaleY.toFixed(3)}`;
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      const pos = clock.estimate() ?? state!.positionMs;
      const sample = sampleEnergyAt(map!, pos);

      const kickTransient = Math.max(0, sample.kick - prevKickSample * 0.72);
      prevKickSample = sample.kick;
      const kickGate = kickTransient < 0.22 ? 0 : kickTransient;

      let bassTarget = compressEnergy(Math.pow(clamp(sample.bass, 0, 1), 0.72));
      let kickTarget = compressEnergy(Math.pow(clamp(kickGate, 0, 1), 0.78));

      if (lowPower) {
        kickTarget *= 0.45;
      }

      smoothedBass = smoothToward(smoothedBass, bassTarget, dtMs, 55, 180);
      smoothedKick = smoothToward(smoothedKick, kickTarget, dtMs, 40, 130);

      const tier = cachedTier;

      let minX = 0.9;
      let maxX = 1.14;
      let minY = 0.88;
      let maxY = 1.19;
      let brightMax = 1.12;
      let glowMax = 0.12;

      if (tier === "tablet") {
        minX = 0.92;
        maxX = 1.12;
        minY = 0.9;
        maxY = 1.16;
        brightMax = 1.1;
        glowMax = 0.1;
      } else if (tier === "mobile") {
        minX = 0.94;
        maxX = 1.1;
        minY = 0.93;
        maxY = 1.13;
        brightMax = 1.08;
        glowMax = 0.07;
      }

      const targetX = clamp(
        1 + smoothedBass * 0.05 + smoothedKick * 0.09,
        minX,
        maxX,
      );
      const targetY = clamp(
        1 + smoothedBass * 0.08 + smoothedKick * 0.14,
        minY,
        maxY,
      );

      currentScaleX = smoothToward(currentScaleX, targetX, dtMs, 45, 160);
      currentScaleY = smoothToward(currentScaleY, targetY, dtMs, 45, 160);
      setScaleX(currentScaleX);
      setScaleY(currentScaleY);

      const energy = clamp(smoothedBass * 0.7 + smoothedKick * 0.5, 0, 1);
      el.style.setProperty(
        "--audio-brightness",
        String(clamp(1 + energy * (brightMax - 1), 1, brightMax)),
      );
      el.style.setProperty(
        "--audio-contrast",
        String(clamp(1 + energy * 0.018, 1, 1.018)),
      );
      if (tier === "mobile" || lowPower) {
        el.style.setProperty("--audio-glow-opacity", "0");
        el.style.setProperty("--audio-glow-blur", "0px");
      } else {
        el.style.setProperty("--audio-glow-opacity", String(energy * glowMax));
        el.style.setProperty("--audio-glow-blur", `${(energy * 8).toFixed(2)}px`);
      }
      el.style.willChange = "transform, filter";

      if (debugEl) {
        debugEl.textContent = [
          `id ${state!.trackId}`,
          `pos ${Math.round(pos)}`,
          `bass ${smoothedBass.toFixed(3)} kick ${smoothedKick.toFixed(3)}`,
          `scale ${currentScaleX.toFixed(4)} / ${currentScaleY.toFixed(4)}`,
        ].join("\n");
      }

      raf = requestAnimationFrame(tick);
    };

    const onTierChange = () => {
      cachedTier = computeTier();
    };

    const onReducedChange = () => {
      cachedReduced = reducedMq.matches;
      if (cachedReduced) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        resetVisual(false);
      } else if (!raf && !destroyed) {
        lastFrameAt = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    mobileMq.addEventListener("change", onTierChange);
    tabletMq.addEventListener("change", onTierChange);
    reducedMq.addEventListener("change", onReducedChange);

    bindSetters();
    if (!cachedReduced) {
      raf = requestAnimationFrame(tick);
    }

    const unsub = subscribe((event) => {
      const trackId = event.trackId || trackIdFromUri(event.trackUri);
      if (!event.trackUri || !trackId) {
        resetVisual(true);
        clock.reset();
        map = null;
        activeTrackId = "";
        return;
      }

      clock.update({
        trackUri: event.trackUri,
        trackId,
        positionMs: event.positionMs,
        durationMs: event.durationMs,
        isPaused: event.isPaused,
        isBuffering: event.isBuffering,
      });

      if (event.type === "started" || trackId !== activeTrackId) {
        if (trackId !== activeTrackId) {
          resetVisual(true);
        }
        void ensureMap(trackId, event.durationMs);
      }

      if (event.isPaused || event.isBuffering || event.type === "stopped") {
        resetVisual(true);
      }
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      mobileMq.removeEventListener("change", onTierChange);
      tabletMq.removeEventListener("change", onTierChange);
      reducedMq.removeEventListener("change", onReducedChange);
      unsub();
      resetVisual(false);
      debugEl?.remove();
    };
  }, [audioReactiveRef, subscribe]);
}
