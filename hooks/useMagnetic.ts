"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Options = {
  /** Fraction of cursor offset the element travels (0-1). */
  strength?: number;
  /** Max travel in px, so large elements don't fly off. */
  maxOffset?: number;
  /** Pull radius as a multiple of the element's own size. */
  radius?: number;
  /** Extra scale applied at full pull strength. */
  scaleAmount?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function useMagnetic<T extends HTMLElement>({
  strength = 0.22,
  maxOffset = 9,
  radius = 1.5,
  scaleAmount = 0.03,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch || reduced) return;

    const quickX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const quickY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const quickScale = gsap.quickTo(el, "scale", { duration: 0.4, ease: "power3.out" });

    const release = () => {
      quickX(0);
      quickY(0);
      quickScale(1);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(rect.width, rect.height) * radius;
      const dist = Math.hypot(dx, dy);

      if (dist > reach) {
        release();
        return;
      }

      const pull = 1 - dist / reach;
      quickX(clamp(dx * strength, -maxOffset, maxOffset));
      quickY(clamp(dy * strength, -maxOffset, maxOffset));
      quickScale(1 + pull * scaleAmount);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", release);

    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", release);
      gsap.set(el, { x: 0, y: 0, scale: 1 });
    };
  }, [isTouch, reduced, strength, maxOffset, radius, scaleAmount]);

  return ref;
}
