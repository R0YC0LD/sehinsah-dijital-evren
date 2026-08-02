"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./MenuCursor.module.css";

export function MenuCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.25, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.25, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const overLink = (e.target as HTMLElement | null)?.closest("button, a");
      el.dataset.active = overLink ? "true" : "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      GİT
    </div>
  );
}
