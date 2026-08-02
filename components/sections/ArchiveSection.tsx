"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { archiveItems } from "@/data/archive";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./ArchiveSection.module.css";

gsap.registerPlugin(ScrollTrigger);

export function ArchiveSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;

    const ctx = gsap.context(() => {
      const cards = ref.current!.querySelectorAll("[data-archive-card]");
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 75%",
            end: "center center",
            scrub: 0.7,
          },
        },
      );
    }, ref);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={ref}
      id="arsiv"
      className={styles.section}
      data-section="arsiv"
      aria-label="Arşiv"
    >
      <div className={styles.header}>
        <p className={styles.index}>05 — ARŞİV</p>
        <h2 className={`display ${styles.title}`}>{siteConfig.archive.title}</h2>
        <p className={styles.subtitle}>{siteConfig.archive.subtitle}</p>
      </div>

      <div className={styles.grid}>
        {archiveItems.map((item) => (
          <article
            key={item.id}
            className={`${styles.card} ${styles[item.layout]}`}
            data-archive-card
            aria-label={`${item.index} ${item.title}`}
          >
            <span className={styles.cardIndex}>{item.index}</span>
            <h3 className={`display ${styles.cardTitle}`}>{item.title}</h3>
            <p className={styles.cardDesc}>{item.description}</p>
            <div className={styles.meta} aria-hidden="true">
              <span>DURUM: BEKLEMEDE</span>
              <span>BAĞLANTI: YOK</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
