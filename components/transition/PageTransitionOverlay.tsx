"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./PageTransitionOverlay.module.css";

const IMAGE_SRC = "/media/transition-loader.png";
const HOLD_MS = 220;
const FADE_MS = 500;
const START_DELAY_MS = 30;

type Phase = "idle" | "active" | "reveal";

export function PageTransitionOverlay() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const timers = useRef<number[]>([]);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    if (reduced) {
      setPhase("idle");
      return;
    }

    setPercent(0);
    setPhase("active");

    const step = (current: number) => {
      const jump = 2 + Math.random() * 15;
      const next = Math.min(100, current + jump);
      setPercent(next);

      if (next >= 100) {
        timers.current.push(
          window.setTimeout(() => setPhase("reveal"), HOLD_MS),
          window.setTimeout(() => setPhase("idle"), HOLD_MS + FADE_MS),
        );
        return;
      }

      const delay = 45 + Math.random() * 150;
      timers.current.push(window.setTimeout(() => step(next), delay));
    };

    timers.current.push(window.setTimeout(() => step(0), START_DELAY_MS));
  }, [pathname, reduced]);

  useLayoutEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  if (phase === "idle") return null;

  return (
    <div
      className={`${styles.overlay} ${phase === "reveal" ? styles.revealing : ""}`}
      aria-hidden="true"
    >
      <div className={styles.imageWrap}>
        <img src={IMAGE_SRC} alt="" className={styles.imageBase} />
        <img
          src={IMAGE_SRC}
          alt=""
          className={styles.imageColor}
          style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
        />
      </div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
