"use client";

import { useEffect, useRef } from "react";
import { useChaos } from "@/components/providers/ChaosProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./ChaosGlitch.module.css";

const TARGET_SELECTOR = "img, h1, h2, h3, .meta-label";
const SLOT_COUNT = 16;
const MIN_DELAY_MS = 350;
const MAX_DELAY_MS = 1600;
const FLASH_CHANCE = 0.3;
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
] as const;

const FLASH_VARIANTS = ["flash1", "flash2", "flash3"] as const;

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

    const scheduleSlot = () => {
      const timer = window.setTimeout(() => {
        if (cancelled) return;

        const pool = Array.from(
          document.querySelectorAll<HTMLElement>(TARGET_SELECTOR),
        ).filter((el) => !applied.has(el));

        if (pool.length) {
          const el = pick(pool);
          const variantName = Math.random() < FLASH_CHANCE ? pick(FLASH_VARIANTS) : pick(JITTER_VARIANTS);
          const cls = styles[variantName];
          if (cls) {
            el.classList.add(styles.glitching, cls);
            applied.set(el, cls);

            const onDone = () => {
              el.removeEventListener("animationend", onDone);
              clearElement(el);
            };
            el.addEventListener("animationend", onDone);
            timers.push(window.setTimeout(onDone, FALLBACK_CLEAR_MS));
          }
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
