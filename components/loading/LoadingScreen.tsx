"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiquidWordmark } from "@/components/loading/LiquidWordmark";
import { useLoadingIntro } from "@/components/loading/useLoadingIntro";
import { registerGsap } from "@/lib/gsap/register";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  const { active, readyToAnimate, reduced, complete, config } = useLoadingIntro();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);
  const exiting = useRef(false);

  const onFilled = useCallback(() => {
    setFilled(true);
  }, []);

  useEffect(() => {
    if (!active || !filled || exiting.current || !overlayRef.current) return;
    exiting.current = true;

    const { gsap, ScrollTrigger } = registerGsap();
    const duration = reduced ? 0.28 : config.exitDuration;

    gsap.to(overlayRef.current, {
      clipPath: "inset(0 0 100% 0)",
      duration,
      ease: "power2.inOut",
      onComplete: () => {
        complete();
        requestAnimationFrame(() => ScrollTrigger.refresh());
      },
    });
  }, [active, filled, reduced, config.exitDuration, complete]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      aria-hidden="true"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <div className={styles.stage}>
        <LiquidWordmark
          word={config.word}
          ready={readyToAnimate}
          reduced={reduced}
          fillDuration={reduced ? 0.22 : config.fillDuration}
          overflowDuration={reduced ? 0.01 : config.overflowDuration}
          onFilled={onFilled}
        />
        <p className={styles.subtitle}>{config.subtitle}</p>
      </div>
    </div>
  );
}
