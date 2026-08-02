"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Marquee } from "@/components/ui/Marquee";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./WordStormSection.module.css";

gsap.registerPlugin(ScrollTrigger);

export function WordStormSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-storm-title]",
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 75%",
            end: "center center",
            scrub: 0.8,
          },
        },
      );
    }, ref);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={ref}
      id="soz"
      className={styles.section}
      data-section="soz"
      aria-label="Söz"
    >
      <h2 className={`display ${styles.title}`} data-storm-title>
        {siteConfig.words[0]}
      </h2>

      <div className={styles.marqueeBlock}>
        <Marquee text={siteConfig.tagline} speed="slow" />
      </div>
    </section>
  );
}
