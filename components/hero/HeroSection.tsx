"use client";

import { useRef } from "react";
import { FallingCharacter } from "@/components/hero/FallingCharacter";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={styles.section}
      aria-label="Ana sayfa"
    >
      <div className={styles.stage}>
        <div className={styles.copy}>
          <h1 className={`display ${styles.title}`}>{siteConfig.artistName}</h1>
          <p className={styles.lines}>
            {siteConfig.hero.lineOne}
            <br />
            {siteConfig.hero.lineTwo}
          </p>
          <ExternalLink
            href={siteConfig.spotify.artistUrl}
            className={styles.cta}
            aria-label="Spotify’da dinle (yeni sekme)"
          >
            {siteConfig.hero.cta}
          </ExternalLink>
        </div>

        <FallingCharacter sectionRef={sectionRef} />

        <a href="#muzik" className={styles.cue}>
          <span>{siteConfig.hero.scrollCue}</span>
          <span className={styles.cueLine} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
