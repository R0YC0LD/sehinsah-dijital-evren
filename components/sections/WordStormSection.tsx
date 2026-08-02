"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlitchText } from "@/components/effects/GlitchText";
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
      const words = ref.current!.querySelectorAll("[data-storm-word]");
      gsap.fromTo(
        words,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 70%",
            end: "center center",
            scrub: 0.8,
          },
        },
      );

      gsap.to("[data-storm-drift]", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
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
      <div className={styles.header}>
        <p className={styles.index}>03 — SÖZ</p>
        <h2 className={`display ${styles.title}`}>
          ANLAM DÜŞER.
          <br />
          SES YÜKSELİR.
        </h2>
      </div>

      <div className={styles.marqueeBlock} data-storm-drift>
        <Marquee text={siteConfig.words[0]} speed="slow" />
        <Marquee text={siteConfig.words[1]} reverse speed="normal" />
        <Marquee text={siteConfig.words[4]} speed="fast" />
      </div>

      <ul className={styles.list}>
        {siteConfig.words.map((word, i) => (
          <li
            key={word}
            data-storm-word
            className={styles.item}
            style={{ "--size": `${clampSize(i)}` } as React.CSSProperties}
          >
            <GlitchText text={word} className={`display ${styles.word}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function clampSize(i: number) {
  const sizes = ["1.2rem", "clamp(1.4rem, 4vw, 2.4rem)", "clamp(1.8rem, 5vw, 3rem)", "1rem", "clamp(1.3rem, 3.5vw, 2rem)"];
  return sizes[i % sizes.length];
}
