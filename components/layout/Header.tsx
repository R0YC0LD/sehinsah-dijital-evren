"use client";

import { siteConfig, sections } from "@/data/site";
import styles from "./Header.module.css";

type Props = {
  scrolled: boolean;
  activeId: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function Header({
  scrolled,
  activeId,
  menuOpen,
  onMenuToggle,
}: Props) {
  const current =
    sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#bosluk" className={styles.mark} data-cursor="AÇ">
        <span>{siteConfig.shortMark}</span>
        <span className={styles.slash}>/</span>
        <span>{current.index}</span>
      </a>

      <p className={styles.sectionName} aria-live="polite">
        {current.label}
      </p>

      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuToggle}
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        data-cursor="AÇ"
      >
        {menuOpen ? "KAPAT" : "MENÜ"}
      </button>
    </header>
  );
}
