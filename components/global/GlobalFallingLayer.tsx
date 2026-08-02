"use client";

import { useLayoutEffect, useRef } from "react";
import { registerGsap } from "@/lib/gsap/register";
import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./GlobalFallingLayer.module.css";

export function GlobalFallingLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const src = assetPath(siteConfig.media.falling);

  useLayoutEffect(() => {
    if (reduced || !characterRef.current || !shadowRef.current) return;

    const { gsap, ScrollTrigger } = registerGsap();
    let settleTimer: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      const character = characterRef.current!;
      const shadow = shadowRef.current!;

      const getStartY = () => window.innerHeight * -0.92;
      const getEndY = () => window.innerHeight * 1.42;

      gsap.set(character, {
        y: getStartY(),
        xPercent: -50,
        rotation: -3,
        scale: 1,
        force3D: true,
      });

      gsap.set(shadow, {
        y: -18,
        scaleY: 1.035,
        opacity: 0.08,
        force3D: true,
      });

      const shadowY = gsap.quickTo(shadow, "y", {
        duration: 0.22,
        ease: "power2.out",
      });
      const shadowScaleY = gsap.quickTo(shadow, "scaleY", {
        duration: 0.22,
        ease: "power2.out",
      });
      const shadowOpacity = gsap.quickTo(shadow, "opacity", {
        duration: 0.22,
        ease: "power2.out",
      });

      gsap.to(character, {
        y: () => getEndY(),
        scale: 0.94,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          id: "global-sehinsah-fall",
          start: 0,
          end: "max",
          scrub: 0.75,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const v = Math.min(Math.abs(self.getVelocity()) / 1600, 1);
            const y = -14 - v * 10;
            const scaleY = 1.02 + v * 0.02;
            const opacity = 0.06 + v * 0.05;
            const blur = 12 + v * 6;

            shadowY(y);
            shadowScaleY(scaleY);
            shadowOpacity(opacity);
            shadow.style.setProperty("--shadow-blur", `${blur}px`);

            settleTimer?.kill();
            settleTimer = gsap.delayedCall(0.2, () => {
              shadowY(-18);
              shadowScaleY(1.035);
              shadowOpacity(0.08);
              shadow.style.setProperty("--shadow-blur", "14px");
            });
          },
        },
      });
    }, rootRef);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);

    return () => {
      settleTimer?.kill();
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className={styles.layer} aria-hidden="true">
      <div ref={characterRef} className={styles.character}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={shadowRef}
          className={styles.shadow}
          data-fall-shadow
          src={src}
          alt=""
          width={1000}
          height={1000}
          draggable={false}
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
  );
}
