"use client";

import { useEffect, useRef } from "react";

export type PointerPos = { x: number; y: number };

/**
 * Tracks pointer without React state churn — mutate refs only.
 */
export function usePointerPosition() {
  const pos = useRef<PointerPos>({ x: 0, y: 0 });
  const normalized = useRef<PointerPos>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      normalized.current.x = (e.clientX - cx) / cx;
      normalized.current.y = (e.clientY - cy) / cy;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return { pos, normalized };
}
