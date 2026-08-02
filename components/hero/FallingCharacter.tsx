"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MediaImage } from "@/components/ui/MediaImage";
import { siteConfig } from "@/data/site";
import { withBasePath } from "@/lib/paths";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./FallingCharacter.module.css";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export function FallingCharacter({ sectionRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const maskUrl = `url("${withBasePath(siteConfig.media.falling)}")`;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const wrap = wrapRef.current;
    if (!section || !wrap || reduced) return;

    const shadow = wrap.querySelector<HTMLElement>("[data-fall-shadow]");
    let velocityTween: gsap.core.Tween | gsap.core.Timeline | null = null;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 900px)",
          mobile: "(max-width: 899px)",
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean };
          const end = desktop ? "+=220%" : "+=180%";

          gsap.set(wrap, {
            y: "-16vh",
            rotation: -3,
            scale: 1,
            opacity: 1,
            x: 0,
            force3D: true,
          });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end,
              scrub: desktop ? 0.75 : 0.65,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (!shadow || !desktop) return;
                const v = Math.min(Math.abs(self.getVelocity()) / 1800, 1);
                shadow.style.setProperty(
                  "--fall-shadow-opacity",
                  String(0.06 + v * 0.07),
                );
                shadow.style.setProperty(
                  "--fall-shadow-blur",
                  `${10 + v * 8}px`,
                );
                shadow.style.setProperty(
                  "--fall-shadow-y",
                  `${-12 - v * 14}px`,
                );
                shadow.style.setProperty(
                  "--fall-shadow-stretch",
                  String(1.03 + v * 0.03),
                );

                velocityTween?.kill();
                velocityTween = gsap.delayedCall(0.12, () => {
                  shadow.style.setProperty("--fall-shadow-opacity", "0.08");
                  shadow.style.setProperty("--fall-shadow-blur", "12px");
                  shadow.style.setProperty("--fall-shadow-y", "-16px");
                  shadow.style.setProperty("--fall-shadow-stretch", "1.03");
                });
              },
            },
          });

          tl.to(wrap, { y: "42vh", scale: 0.96, opacity: 1 }, 0).to(
            wrap,
            { y: "116vh", scale: 0.9, opacity: 0 },
            0.55,
          );
        },
      );

      return () => mm.revert();
    }, wrap);

    return () => {
      velocityTween?.kill();
      ctx.revert();
    };
  }, [sectionRef, reduced]);

  return (
    <div className={styles.track} aria-hidden={false}>
      <div
        ref={wrapRef}
        className={`falling-character ${styles.character}`}
      >
        <span
          className={styles.shadow}
          data-fall-shadow
          aria-hidden="true"
          style={{ WebkitMaskImage: maskUrl, maskImage: maskUrl }}
        />
        <MediaImage
          src={siteConfig.media.falling}
          alt="Şehinşah — şeffaf düşüş görseli"
          width={1000}
          height={1000}
          priority
          className={styles.image}
          onErrorFallback={<div className={styles.fallback} aria-hidden="true" />}
        />
      </div>
    </div>
  );
}
