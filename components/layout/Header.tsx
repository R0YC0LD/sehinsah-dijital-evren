"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";
import styles from "./Header.module.css";

type Props = {
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function Header({ menuOpen, onMenuToggle }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#hero" className={`display ${styles.brand}`}>
        {siteConfig.artistName}
      </a>

      <div className={styles.actions}>
        <a href="#muzik" className={styles.listen}>
          DİNLE ↗
        </a>
        <button
          type="button"
          id="menu-trigger"
          className={styles.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="interactive-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? "KAPAT" : "MENÜ"}
        </button>
      </div>
    </header>
  );
}
