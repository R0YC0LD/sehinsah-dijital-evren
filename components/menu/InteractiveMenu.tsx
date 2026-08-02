"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformLinks } from "@/components/platforms/PlatformLinks";
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
  const navRef = useRef<HTMLElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const [activeId, setActiveId] = useState(siteConfig.nav[0].id);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const dragPointerId = useRef<number | null>(null);
  const rafId = useRef(0);
  const latestPoint = useRef({ x: 0, y: 0 });
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
      setDragging(false);
      moved.current = false;
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

  const resolveMenuId = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const node = el.closest<HTMLElement>("[data-menu-id]");
    return node?.dataset.menuId || null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    latestPoint.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    dragPointerId.current = e.pointerId;
    navRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (dragPointerId.current !== e.pointerId) return;
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

    latestPoint.current = { x: e.clientX, y: e.clientY };
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    if (!moved.current && Math.hypot(dx, dy) > 7) {
      moved.current = true;
      setDragging(true);
    }

    if (!moved.current) return;
    if (rafId.current) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      const id = resolveMenuId(latestPoint.current.x, latestPoint.current.y);
      if (id) setActiveId((prev) => (prev === id ? prev : id));
    });
  };

  const endPointer = (e: React.PointerEvent<HTMLElement>) => {
    if (dragPointerId.current !== e.pointerId) return;
    dragPointerId.current = null;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }
    setDragging(false);
  };

  const verifiedCover =
    catalog.latestRelease?.verified && catalog.latestRelease.imageUrl
      ? catalog.latestRelease.imageUrl
      : null;

  return (
    <div
      ref={rootRef}
      id="interactive-menu"
      className={`${styles.menu} ${open ? styles.open : ""}`}
      aria-hidden={!open}
    >
      <div className={styles.grid}>
        <nav
          ref={navRef}
          className={`${styles.nav} ${dragging ? styles.dragging : ""}`}
          aria-label="Site menüsü"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {siteConfig.nav.map((item, i) => (
            <button
              key={item.id}
              ref={i === 0 ? firstRef : undefined}
              type="button"
              data-menu-id={item.id}
              data-menu-index={i}
              className={`${styles.link} ${activeId === item.id ? styles.active : ""}`}
              onMouseEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              onClick={() => {
                if (moved.current) {
                  moved.current = false;
                  return;
                }
                go(item.href);
              }}
            >
              <span className={styles.index}>{item.index}</span>
              <span className={`display ${styles.label}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <MenuPreview activeId={activeId} latestCover={verifiedCover} />
      </div>

      <div className={styles.footer}>
        <div className={styles.platforms}>
          <span className={styles.platformLabel}>DİNLE</span>
          <PlatformLinks variant="all" placement="menu" />
        </div>
        <div className={styles.metaRow}>
          <ExternalLink href={siteConfig.links.bubilet}>BUBİLET ↗</ExternalLink>
          <ChaosToggle />
        </div>
      </div>

      {!isTouch && open ? <MenuCursor /> : null}
    </div>
  );
}
