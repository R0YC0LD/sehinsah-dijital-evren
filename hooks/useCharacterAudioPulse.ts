"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  buildBpmBeatMap,
  findBeatIndex,
  type TrackBeatMap,
} from "@/lib/audio/beat-map";
import { createPlaybackClock } from "@/lib/audio/playback-clock";
import { loadBeatMap } from "@/data/audio-analysis";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { siteConfig } from "@/data/site";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function trackIdFromUri(uri: string) {
  const parts = uri.split(":");
  return parts[parts.length - 1] || "";
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function lowPowerMode() {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData) || (navigator.hardwareConcurrency || 8) <= 4;
}

export function useCharacterAudioPulse(audioPulseRef: React.RefObject<HTMLElement | null>) {
  const { subscribe, unlocked } = useSpotifyPlayback();
  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;

  useEffect(() => {
    if (!siteConfig.audioPulse.enabled) return;

    const clock = createPlaybackClock();
    let map: TrackBeatMap | null = null;
    let beatIndex = 0;
    let raf = 0;
    let lastPulseAt = 0;
    let activeTrackId = "";
    let destroyed = false;
    let debugEl: HTMLDivElement | null = null;
    let pulseCount = 0;
    let dropped = 0;

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

    const resetVisual = (duration = 0.15) => {
      const el = audioPulseRef.current;
      if (!el) return;
      gsap.killTweensOf(el, "scaleX,scaleY");
      gsap.to(el, { scaleX: 1, scaleY: 1, duration, ease: "power2.out", overwrite: "auto" });
      el.style.removeProperty("--audio-brightness");
      el.style.removeProperty("--audio-glow-blur");
      el.style.removeProperty("--audio-glow-opacity");
      el.classList.remove("audioPulseActive");
    };

    const triggerHeartbeat = (strength: number) => {
      const el = audioPulseRef.current;
      if (!el || !unlockedRef.current) return;

      const now = performance.now();
      const minGap = isMobileViewport() ? 280 : 220;
      if (now - lastPulseAt < minGap) {
        dropped += 1;
        return;
      }
      lastPulseAt = now;
      pulseCount += 1;

      const eased = Math.pow(clamp(strength, 0, 1), 0.72);
      const mobile = isMobileViewport();
      const maxY = mobile ? 1.016 : 1.024;
      const maxX = mobile ? 1.013 : 1.02;
      const primaryY = lerp(mobile ? 1.004 : 1.008, maxY, eased);
      const primaryX = lerp(mobile ? 1.004 : 1.006, maxX, eased);
      const secondaryY = lerp(1.003, mobile ? 1.008 : 1.013, eased);
      const secondaryX = lerp(1.002, mobile ? 1.006 : 1.01, eased);
      const reduced = prefersReducedMotion();
      const simple = lowPowerMode();

      el.classList.add("audioPulseActive");
      el.style.setProperty("--audio-brightness", String(lerp(1, mobile ? 1.022 : 1.03, eased)));
      el.style.setProperty("--audio-glow-blur", `${lerp(0, 8, eased)}px`);
      el.style.setProperty("--audio-glow-opacity", String(lerp(0, 0.035, eased)));

      if (reduced) {
        gsap.killTweensOf(el, "scaleX,scaleY");
        el.style.setProperty("--audio-brightness", "1.01");
        window.setTimeout(() => {
          el.style.setProperty("--audio-brightness", "1");
          el.style.setProperty("--audio-glow-opacity", "0");
          el.style.setProperty("--audio-glow-blur", "0px");
        }, 150);
        return;
      }

      gsap.killTweensOf(el, "scaleX,scaleY");
      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      tl.to(el, {
        scaleX: primaryX,
        scaleY: primaryY,
        duration: 0.055,
        ease: "power2.out",
      }).to(el, {
        scaleX: 0.998,
        scaleY: 0.997,
        duration: 0.09,
        ease: "power2.inOut",
      });

      if (!simple) {
        tl.to(el, {
          scaleX: secondaryX,
          scaleY: secondaryY,
          duration: 0.065,
          ease: "power2.out",
        });
      }

      tl.to(el, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.16,
        ease: "power2.out",
        onComplete: () => {
          el.style.setProperty("--audio-brightness", "1");
          el.style.setProperty("--audio-glow-opacity", "0");
          el.style.setProperty("--audio-glow-blur", "0px");
        },
      });
    };

    const ensureMap = async (trackId: string, durationMs: number) => {
      if (!trackId || trackId === activeTrackId) return;
      activeTrackId = trackId;
      beatIndex = 0;
      const authored = await loadBeatMap(trackId);
      if (destroyed) return;
      map = authored || buildBpmBeatMap(trackId, durationMs);
      const pos = clock.estimate() ?? 0;
      beatIndex = findBeatIndex(map.beats, pos);
    };

    const tick = () => {
      if (destroyed) return;
      const state = clock.get();
      const el = audioPulseRef.current;

      if (!state || state.isPaused || state.isBuffering || !unlockedRef.current || !map) {
        if (debugEl && state) {
          debugEl.textContent = `paused/buffer · ${state.trackId}\npulse:${pulseCount} drop:${dropped}`;
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      const pos = clock.estimate() ?? state.positionMs;
      while (map && beatIndex < map.beats.length && map.beats[beatIndex].timeMs <= pos) {
        const beat = map.beats[beatIndex];
        beatIndex += 1;
        if (beat.type === "secondary" && lowPowerMode()) continue;
        triggerHeartbeat(beat.strength);
      }

      if (el) {
        if (!state.isPaused) el.style.willChange = "transform, filter";
        else el.style.willChange = "auto";
      }

      if (debugEl) {
        const next = map?.beats[beatIndex];
        debugEl.textContent = [
          `id ${state.trackId}`,
          `pos ${Math.round(pos)} / est`,
          `next ${next ? Math.round(next.timeMs) : "-"}`,
          `bpm ${map?.bpm ?? "-"}`,
          `pulse ${pulseCount} drop ${dropped}`,
        ].join("\n");
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const unsub = subscribe((event) => {
      const trackId = event.trackId || trackIdFromUri(event.trackUri);
      if (!event.trackUri || !trackId) {
        resetVisual(0.14);
        clock.reset();
        map = null;
        activeTrackId = "";
        return;
      }

      if (!siteConfig.audioPulse.verifiedOnly) {
        /* keep going */
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
        void ensureMap(trackId, event.durationMs);
      } else if (map) {
        const estimated = clock.estimate() ?? event.positionMs;
        const drift = event.positionMs - estimated;
        if (Math.abs(drift) > 450) {
          beatIndex = findBeatIndex(map.beats, event.positionMs);
        }
      }

      if (event.isPaused || event.isBuffering || event.type === "stopped") {
        resetVisual(0.14);
      }
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      unsub();
      resetVisual(0);
      debugEl?.remove();
    };
  }, [audioPulseRef, subscribe]);
}
