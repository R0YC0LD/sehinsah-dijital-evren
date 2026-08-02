"use client";

import { useLayoutEffect, useRef } from "react";
import { registerGsap } from "@/lib/gsap/register";
import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import { useCharacterAudioPulse } from "@/hooks/useCharacterAudioPulse";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./GlobalFallingLayer.module.css";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function GlobalFallingLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const audioReactiveRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const src = assetPath(siteConfig.media.falling);

  useCharacterAudioPulse(audioReactiveRef);

  useLayoutEffect(() => {
    if (reduced || !characterRef.current || !shadowRef.current) return;

    const { gsap, ScrollTrigger } = registerGsap();
    let settleTimer: gsap.core.Tween | null = null;
    let raf = 0;
    let pendingSelf: ScrollTrigger | null = null;

    const isMobile = () => window.matchMedia("(max-width: 899px)").matches;

    const ctx = gsap.context(() => {
      const character = characterRef.current!;
      const shadow = shadowRef.current!;

      const getStartY = () => window.innerHeight * -0.64;
      const getEndY = () => window.innerHeight * 1.24;

      const restOpacity = () => (isMobile() ? 0.018 : 0.028);
      const maxOpacity = () => (isMobile() ? 0.048 : 0.066);
      const maxOffset = () => (isMobile() ? 16 : 22);
      const maxBlur = () => (isMobile() ? 13 : 17);

      const applyShadow = (y: number, blur: number, opacity: number, scaleY: number) => {
        shadow.style.setProperty("--shadow-y", `${y.toFixed(2)}px`);
        shadow.style.setProperty("--shadow-blur", `${blur.toFixed(2)}px`);
        shadow.style.setProperty("--shadow-opacity", opacity.toFixed(3));
        shadow.style.setProperty("--shadow-scale-y", scaleY.toFixed(3));
      };

      applyShadow(-6, 8, restOpacity(), 1.01);

      gsap.set(character, {
        y: getStartY(),
        xPercent: -50,
        rotation: -3,
        scale: 1,
        force3D: true,
      });

      const updateFromTrigger = (self: ScrollTrigger) => {
        const rawVelocity = self.getVelocity();
        const direction = Math.sign(rawVelocity) || 1;
        const speed = clamp(Math.abs(rawVelocity) / 2400, 0, 1);
        const mobile = isMobile();

        const targetOffset =
          direction >= 0
            ? lerp(-8, -maxOffset(), speed)
            : lerp(6, mobile ? 14 : 18, speed);

        const targetBlur = lerp(8, maxBlur(), speed);
        const targetOpacity = lerp(restOpacity(), maxOpacity(), speed);
        const targetScaleY = lerp(1.01, mobile ? 1.024 : 1.03, speed);

        applyShadow(targetOffset, targetBlur, targetOpacity, targetScaleY);

        settleTimer?.kill();
        settleTimer = gsap.delayedCall(0.2, () => {
          applyShadow(-6, 8, restOpacity(), 1.01);
        });
      };

      gsap.to(character, {
        y: () => getEndY(),
        scale: 0.95,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          id: "global-sehinsah-fall",
          start: 0,
          end: "max",
          scrub: 0.85,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            pendingSelf = self;
            if (raf) return;
            raf = requestAnimationFrame(() => {
              raf = 0;
              if (pendingSelf) updateFromTrigger(pendingSelf);
            });
          },
        },
      });
    }, rootRef);

    const refresh = () => ScrollTrigger.refresh();
    const onLoadingComplete = () => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("sehinsah:loading-complete", onLoadingComplete);

    return () => {
      settleTimer?.kill();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("sehinsah:loading-complete", onLoadingComplete);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className={styles.layer} aria-hidden="true">
      <div ref={characterRef} className={styles.character}>
        <div ref={audioReactiveRef} className={styles.audioReactive} data-audio-reactive>
          <span
            ref={shadowRef}
            className={styles.shadow}
            data-fall-shadow
            style={{ "--fall-mask": `url("${src}")` } as React.CSSProperties}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.image}
            src={src}
            alt=""
            width={1000}
            height={1000}
            draggable={false}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
