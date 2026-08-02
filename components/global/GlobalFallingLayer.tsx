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
  const reduced = useReducedMotion();
  const src = assetPath(siteConfig.media.falling);

  useLayoutEffect(() => {
    if (reduced || !characterRef.current) return;

    const { gsap, ScrollTrigger } = registerGsap();
    let velocityTimer: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      const getStartY = () => window.innerHeight * -0.65;
      const getEndY = () => window.innerHeight * 1.25;

      gsap.set(characterRef.current, {
        y: getStartY(),
        xPercent: -50,
        rotation: -3,
        scale: 1,
        force3D: true,
      });

      gsap.to(characterRef.current, {
        y: () => getEndY(),
        scale: 0.94,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          id: "global-sehinsah-fall",
          start: 0,
          end: "max",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const shadow = characterRef.current?.querySelector<HTMLElement>(
              "[data-fall-shadow]",
            );
            if (!shadow) return;
            const v = Math.min(Math.abs(self.getVelocity()) / 2000, 1);
            shadow.style.setProperty("--shadow-y", `${-14 - v * 10}px`);
            shadow.style.setProperty("--shadow-blur", `${12 + v * 6}px`);
            shadow.style.setProperty("--shadow-opacity", String(0.06 + v * 0.05));

            velocityTimer?.kill();
            velocityTimer = gsap.delayedCall(0.18, () => {
              shadow.style.setProperty("--shadow-y", "-18px");
              shadow.style.setProperty("--shadow-blur", "14px");
              shadow.style.setProperty("--shadow-opacity", "0.08");
            });
          },
        },
      });
    }, rootRef);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);

    return () => {
      velocityTimer?.kill();
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
