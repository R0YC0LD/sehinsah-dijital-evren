"use client";

import { useEffect, useRef, useState } from "react";
import { ChaosToggle } from "@/components/ui/ChaosToggle";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { MenuCursor } from "@/components/menu/MenuCursor";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { siteConfig } from "@/data/site";
import type { MusicCatalog } from "@/lib/spotify/types";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import styles from "./InteractiveMenu.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  catalog: MusicCatalog;
  onStopAudio?: () => void;
};

export function InteractiveMenu({ open, onClose, catalog, onStopAudio }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const [activeId, setActiveId] = useState(siteConfig.nav[0].id);
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (open) {
      onStopAudio?.();
      firstRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      document.getElementById("menu-trigger")?.focus();
      wasOpen.current = false;
    }
    return () => document.body.classList.remove("menu-open");
  }, [open, onStopAudio]);

  useEffect(() => {
    if (!open) return;

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

  const go = (href: string) => {
    onClose();
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  };

  return (
    <div
      ref={rootRef}
      id="interactive-menu"
      className={`${styles.menu} ${open ? styles.open : ""}`}
      aria-hidden={!open}
    >
      <div className={styles.grid}>
        <nav className={styles.nav} aria-label="Site menüsü">
          {siteConfig.nav.map((item, i) => (
            <button
              key={item.id}
              ref={i === 0 ? firstRef : undefined}
              type="button"
              className={`${styles.link} ${activeId === item.id ? styles.active : ""}`}
              onMouseEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              onClick={() => go(item.href)}
            >
              <span className={styles.index}>{item.index}</span>
              <span className={`display ${styles.label}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <MenuPreview
          activeId={activeId}
          latestCover={catalog.latestRelease?.imageUrl || null}
        />
      </div>

      <div className={styles.footer}>
        <a href="#muzik" className={styles.listen} onClick={() => go("#muzik")}>
          DİNLE ↗
        </a>
        <ExternalLink href={siteConfig.links.bubilet}>BUBİLET ↗</ExternalLink>
        <ExternalLink href={siteConfig.links.instagram}>INSTAGRAM ↗</ExternalLink>
        <ChaosToggle />
      </div>

      {!isTouch && open ? <MenuCursor /> : null}
    </div>
  );
}
