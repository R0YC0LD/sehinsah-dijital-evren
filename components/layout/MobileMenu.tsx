"use client";

import { useEffect, useRef } from "react";
import { ChaosToggle } from "@/components/ui/ChaosToggle";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./MobileMenu.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !rootRef.current) return;
      const items = rootRef.current.querySelectorAll<HTMLElement>(
        'a, button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      id="mobile-menu"
      className={`${styles.menu} ${open ? styles.open : ""}`}
      aria-hidden={!open}
    >
      <nav className={styles.nav} aria-label="Mobil menü">
        {siteConfig.nav.map((item, i) => (
          <a
            key={item.id}
            ref={i === 0 ? firstRef : undefined}
            href={item.href}
            className={`display ${styles.link}`}
            onClick={onClose}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className={styles.meta}>
        <ExternalLink href={siteConfig.spotify.artistUrl} className={styles.spotify}>
          SPOTIFY’DA DİNLE ↗
        </ExternalLink>
        <ExternalLink href={siteConfig.tickets.url}>BUBİLET ↗</ExternalLink>
        <ExternalLink href={siteConfig.instagram.url}>INSTAGRAM ↗</ExternalLink>
        <ChaosToggle />
      </div>
    </div>
  );
}
