"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./PageTransitionOverlay.module.css";

const IMAGE_SRC = "/media/transition-loader.png";
const FILL_MS = 700;
const HOLD_MS = 200;
const FADE_MS = 500;

type Phase = "idle" | "cover" | "fill" | "reveal";

export function PageTransitionOverlay() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
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

    setPhase("cover");
    timers.current.push(
      window.setTimeout(() => setPhase("fill"), 30),
      window.setTimeout(() => setPhase("reveal"), 30 + FILL_MS + HOLD_MS),
      window.setTimeout(() => setPhase("idle"), 30 + FILL_MS + HOLD_MS + FADE_MS),
    );
  }, [pathname, reduced]);

  useLayoutEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  if (phase === "idle") return null;

  const filled = phase === "fill" || phase === "reveal";

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
          className={`${styles.imageColor} ${filled ? styles.filled : ""}`}
        />
      </div>
      <div className={styles.bar}>
        <div className={`${styles.barFill} ${filled ? styles.filled : ""}`} />
      </div>
    </div>
  );
}
