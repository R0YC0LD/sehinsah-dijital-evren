"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { sections } from "@/data/site";
import styles from "./MenuOverlay.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
};

export function MenuOverlay({ open, onClose, onNavigate }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !rootRef.current) return;

      const focusables = rootRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const links = root.querySelectorAll("[data-menu-link]");
    const preview = root.querySelector("[data-menu-preview]");

    if (open) {
      gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.fromTo(
        panel,
        { xPercent: 110, skewX: 6 },
        { xPercent: 0, skewX: 0, duration: 0.95, ease: "power4.inOut" },
      );
      gsap.fromTo(
        links,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.7,
          ease: "power3.out",
          delay: 0.25,
        },
      );
      if (preview) {
        gsap.fromTo(
          preview,
          { opacity: 0, scale: 1.08 },
          { opacity: 0.35, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.2 },
        );
      }
    } else {
      gsap.to(panel, {
        xPercent: 110,
        duration: 0.7,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
        },
      });
    }
  }, [open]);

  return (
    <div
      ref={rootRef}
      id="site-menu"
      className={styles.overlay}
      aria-hidden={!open}
      style={{ visibility: "hidden" }}
    >
      <div className={styles.preview} data-menu-preview aria-hidden="true">
        ŞEHİNŞAH
      </div>
      <div ref={panelRef} className={styles.panel}>
        <nav className={styles.nav} aria-label="Ana menü">
          {sections.map((section, i) => (
            <button
              key={section.id}
              ref={i === 0 ? firstLinkRef : undefined}
              type="button"
              className={styles.link}
              data-menu-link
              data-cursor="AÇ"
              onClick={() => {
                onNavigate(section.href);
                onClose();
              }}
              onPointerEnter={() => {
                const preview = rootRef.current?.querySelector(
                  "[data-menu-preview]",
                );
                if (preview) preview.textContent = section.label;
              }}
            >
              <span className={styles.index}>{section.index}</span>
              <span className={`display ${styles.label}`}>{section.label}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          data-cursor="AÇ"
        >
          KAPAT
        </button>
      </div>
    </div>
  );
}
