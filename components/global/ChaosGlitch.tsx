"use client";

import { useEffect, useRef } from "react";
import { useChaos } from "@/components/providers/ChaosProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./ChaosGlitch.module.css";

const TARGET_SELECTOR = "img, h1, h2, h3, .meta-label";
const SLOT_COUNT = 26;
const MIN_DELAY_MS = 120;
const MAX_DELAY_MS = 800;
const FLASH_CHANCE = 0.3;
const CLUSTER_CHANCE = 0.25;
const CLUSTER_MIN = 2;
const CLUSTER_MAX = 4;
const FALLBACK_CLEAR_MS = 900;

const JITTER_VARIANTS = [
  "jitter1",
  "jitter2",
  "jitter3",
  "jitter4",
  "jitter5",
  "jitter6",
  "jitter7",
  "jitter8",
  "jitter9",
  "jitter10",
  "jitter11",
  "jitter12",
  "jitter13",
  "jitter14",
  "jitter15",
  "jitter16",
  "jitter17",
] as const;

const FLASH_VARIANTS = ["flash1", "flash2", "flash3"] as const;

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ChaosGlitch() {
  const { chaos } = useChaos();
  const reduced = useReducedMotion();
  const active = chaos && !reduced;
  const appliedRef = useRef(new Map<HTMLElement, string>());

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: number[] = [];
    const applied = appliedRef.current;

    const clearElement = (el: HTMLElement) => {
      const cls = applied.get(el);
      if (!cls) return;
      el.classList.remove(styles.glitching, cls);
      applied.delete(el);
    };

    const hitElement = (el: HTMLElement) => {
      const variantName = Math.random() < FLASH_CHANCE ? pick(FLASH_VARIANTS) : pick(JITTER_VARIANTS);
      const cls = styles[variantName];
      if (!cls) return;
      el.classList.add(styles.glitching, cls);
      applied.set(el, cls);

      const onDone = () => {
        el.removeEventListener("animationend", onDone);
        clearElement(el);
      };
      el.addEventListener("animationend", onDone);
      timers.push(window.setTimeout(onDone, FALLBACK_CLEAR_MS));
    };

    const scheduleSlot = () => {
      const timer = window.setTimeout(() => {
        if (cancelled) return;

        const pool = Array.from(
          document.querySelectorAll<HTMLElement>(TARGET_SELECTOR),
        ).filter((el) => !applied.has(el));

        if (pool.length) {
          // Occasionally corrupt several elements in the same burst instead
          // of always one at a time — reads more like a cascading signal
          // failure than a single flickering pixel.
          const hitCount =
            Math.random() < CLUSTER_CHANCE
              ? Math.min(pool.length, CLUSTER_MIN + Math.floor(Math.random() * (CLUSTER_MAX - CLUSTER_MIN + 1)))
              : 1;
          const targets = shuffle(pool).slice(0, hitCount);
          targets.forEach(hitElement);
        }

        scheduleSlot();
      }, randomDelay());
      timers.push(timer);
    };

    for (let i = 0; i < SLOT_COUNT; i += 1) scheduleSlot();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      applied.forEach((_cls, el) => clearElement(el));
    };
  }, [active]);

  return null;
}
