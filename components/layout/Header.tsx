"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMagnetic } from "@/hooks/useMagnetic";
import { siteConfig } from "@/data/site";
import styles from "./Header.module.css";

type Props = {
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function Header({ menuOpen, onMenuToggle }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const listenRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, maxOffset: 7, radius: 1.6 });
  const menuBtnRef = useMagnetic<HTMLButtonElement>({ strength: 0.22, maxOffset: 8, radius: 1.6 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") return;
    event.preventDefault();
    router.push("/");
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#hero" className={`display ${styles.brand}`} onClick={onBrandClick}>
        {siteConfig.artistName}
      </a>

      <div className={styles.actions}>
        <a ref={listenRef} href="#muzik" className={styles.listen}>
          DİNLE ↗
        </a>
        <button
          ref={menuBtnRef}
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
