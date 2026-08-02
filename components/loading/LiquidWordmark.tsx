"use client";

import { useLayoutEffect, useRef } from "react";
import { registerGsap } from "@/lib/gsap/register";
import styles from "./LoadingScreen.module.css";

type Props = {
  word: string;
  ready: boolean;
  reduced: boolean;
  fillDuration: number;
  overflowDuration: number;
  onFilled: () => void;
};

export function LiquidWordmark({
  word,
  ready,
  reduced,
  fillDuration,
  overflowDuration,
  onFilled,
}: Props) {
  const liquidRef = useRef<SVGRectElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const dropsRef = useRef<SVGGElement>(null);
  const rootRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    if (!ready || !liquidRef.current) return;

    const { gsap } = registerGsap();
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(liquidRef.current, { y: 20 });
        gsap.set(dropsRef.current, { opacity: 0 });
        onFilled();
        return;
      }

      gsap.set(liquidRef.current, { y: 320 });
      gsap.set(dropsRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        onComplete: onFilled,
      });

      tl.to(liquidRef.current, {
        y: 8,
        duration: fillDuration,
        ease: "power1.inOut",
      });

      if (waveRef.current) {
        tl.to(
          waveRef.current,
          {
            x: 40,
            duration: fillDuration * 0.9,
            ease: "sine.inOut",
          },
          0.15,
        );
      }

      tl.to(
        dropsRef.current,
        {
          opacity: 1,
          duration: 0.2,
          ease: "power1.out",
        },
        fillDuration * 0.86,
      );

      if (dropsRef.current) {
        const drops = dropsRef.current.querySelectorAll("ellipse, path");
        tl.to(
          drops,
          {
            y: 10,
            scaleY: 1.15,
            duration: overflowDuration,
            stagger: 0.04,
            ease: "power2.out",
          },
          fillDuration * 0.86,
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, [ready, reduced, fillDuration, overflowDuration, onFilled]);

  return (
    <svg
      ref={rootRef}
      className={styles.logo}
      viewBox="0 0 1400 360"
      role="img"
      aria-label={word}
    >
      <defs>
        <linearGradient id="slime-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#76ff62" />
          <stop offset="32%" stopColor="#1ed760" />
          <stop offset="68%" stopColor="#0b9f42" />
          <stop offset="100%" stopColor="#04391b" />
        </linearGradient>
        <mask id="sehinsah-text-mask">
          <rect width="100%" height="100%" fill="black" />
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={styles.maskText}
            fill="white"
          >
            {word}
          </text>
        </mask>
      </defs>

      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        className={styles.outlineText}
      >
        {word}
      </text>

      <g mask="url(#sehinsah-text-mask)">
        <rect
          ref={liquidRef}
          x="-40"
          y="0"
          width="1480"
          height="420"
          fill="url(#slime-gradient)"
        />
        <path
          ref={waveRef}
          className={styles.wave}
          d="M-40 40 Q 120 28 280 40 T 600 40 T 920 40 T 1240 40 T 1480 40 V 420 H -40 Z"
          fill="url(#slime-gradient)"
          opacity="0.55"
        />
      </g>

      <g ref={dropsRef} className={styles.drops} aria-hidden="true">
        <ellipse cx="320" cy="78" rx="7" ry="11" fill="#1ed760" opacity="0.75" />
        <ellipse cx="690" cy="70" rx="6" ry="13" fill="#76ff62" opacity="0.7" />
        <ellipse cx="980" cy="82" rx="5" ry="10" fill="#0b9f42" opacity="0.8" />
        <path d="M520 86 C524 98 518 110 522 118" stroke="#1ed760" strokeWidth="2.2" fill="none" opacity="0.65" />
      </g>
    </svg>
  );
}
