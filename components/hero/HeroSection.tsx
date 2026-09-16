"use client";

import { EntropyBrain } from "@/components/easteregg/EntropyBrain";
import { useMagnetic } from "@/hooks/useMagnetic";
import { siteConfig } from "@/data/site";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const ctaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, maxOffset: 10, radius: 1.6 });

  return (
    <section id="hero" className={`section-shell ${styles.section}`} aria-label="Ana sayfa">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={styles.axis} />
      </div>

      <div className={`section-content ${styles.content}`}>
        <p className="meta-label">{siteConfig.hero.meta}</p>
        <h1 className={`display ${styles.title}`}>{siteConfig.artistName}</h1>
        <p className={styles.lines}>
          {siteConfig.hero.lineOne}
          <br />
          {siteConfig.hero.lineTwo}
        </p>
        <a ref={ctaRef} href="#muzik" className={styles.cta}>
          {siteConfig.hero.cta}
        </a>

        <a href="#muzik" className={styles.cue}>
          <span>{siteConfig.hero.scrollCue}</span>
          <span className={styles.cueLine} aria-hidden="true" />
        </a>
      </div>
      <EntropyBrain id="hero-lower-left" />
    </section>
  );
}
