"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./CustomCursor.module.css";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isTouch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const xTo = gsap.quickTo(dot, "x", {
      duration: reduced ? 0.01 : 0.16,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(dot, "y", {
      duration: reduced ? 0.01 : 0.16,
      ease: "power3.out",
    });
    const rxTo = gsap.quickTo(ring, "x", {
      duration: reduced ? 0.01 : 0.35,
      ease: "power3.out",
    });
    const ryTo = gsap.quickTo(ring, "y", {
      duration: reduced ? 0.01 : 0.35,
      ease: "power3.out",
    });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rxTo(e.clientX);
      ryTo(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        "a, button, [data-cursor]",
      ) as HTMLElement | null;
      if (!target) {
        setActive(false);
        setLabel("");
        return;
      }
      setActive(true);
      setLabel(target.dataset.cursor || "AÇ");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, [isTouch, reduced]);

  if (isTouch) return null;

  return (
    <div className={styles.root} aria-hidden="true">
      <div ref={dotRef} className={styles.dot} />
      <div
        ref={ringRef}
        className={`${styles.ring} ${active ? styles.active : ""}`}
      >
        {active && label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}
