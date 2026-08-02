"use client";

import { useEffect, useState } from "react";
import { ChaosToggle } from "@/components/ui/ChaosToggle";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./Header.module.css";

type Props = {
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function Header({ menuOpen, onMenuToggle }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#hero" className={`display ${styles.brand}`}>
        {siteConfig.artistName}
      </a>

      <nav className={styles.nav} aria-label="Ana gezinme">
        {siteConfig.nav.slice(1).map((item) => (
          <a key={item.id} href={item.href} className={styles.link}>
            {item.label}
          </a>
        ))}
        <ExternalLink
          href={siteConfig.spotify.artistUrl}
          className={styles.spotify}
          aria-label="Spotify’da dinle (yeni sekme)"
        >
          SPOTIFY’DA DİNLE ↗
        </ExternalLink>
        <ChaosToggle className={styles.chaosDesktop} />
      </nav>

      <div className={styles.mobileActions}>
        <ExternalLink
          href={siteConfig.spotify.artistUrl}
          className={styles.spotifyCompact}
          aria-label="Spotify’da dinle (yeni sekme)"
        >
          SPOTIFY ↗
        </ExternalLink>
        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? "KAPAT" : "MENÜ"}
        </button>
      </div>
    </header>
  );
}
