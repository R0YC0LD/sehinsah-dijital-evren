"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "span";
};

export function MagneticElement({
  children,
  className = "",
  strength = 8,
  as = "div",
}: Props) {
  const ref = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();
  const Tag = as;

  const onMove = (e: React.PointerEvent) => {
    if (isTouch || reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const max = Math.min(strength, 10);
    gsap.to(ref.current, {
      x: (x / rect.width) * max,
      y: (y / rect.height) * max,
      duration: 0.35,
      ease: "power2.out",
    });
  };

  const onLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.45, ease: "power2.out" });
  };

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </Tag>
  );
}
