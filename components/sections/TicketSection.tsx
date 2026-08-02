"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MagneticElement } from "@/components/effects/MagneticElement";
import { MediaImage } from "@/components/ui/MediaImage";
import { siteConfig } from "@/data/site";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./TicketSection.module.css";

export function TicketSection() {
  const posterRef = useRef<HTMLAnchorElement>(null);
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (isTouch || reduced || !posterRef.current) return;
    const rect = posterRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(posterRef.current, {
      rotateY: px * 8,
      rotateX: -py * 6,
      scale: 1.015,
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const onLeave = () => {
    if (!posterRef.current) return;
    gsap.to(posterRef.current, {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <section
      id="sahne"
      className={styles.section}
      data-section="sahne"
      aria-label="Sahne"
    >
      <div className={styles.copy}>
        <h2 className={`display ${styles.title}`}>{siteConfig.ticket.title}</h2>
        <p className={styles.subtitle}>{siteConfig.ticket.subtitle}</p>
      </div>

      <div className={styles.posterScene}>
        <span className={styles.ghost} aria-hidden="true" />

        <a
          ref={posterRef}
          href={siteConfig.links.bubilet}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.poster}
          data-cursor="BİLET ↗"
          aria-label="Bubilet’te Şehinşah etkinliklerini görüntüle (yeni sekme)"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <MediaImage
            src={siteConfig.media.bubilet}
            alt="Şehinşah Bubilet etkinlik afişi"
            width={960}
            height={960}
            className={styles.image}
            onErrorFallback={<span className={styles.fallback}>—</span>}
          />
        </a>

        <MagneticElement className={styles.ctaWrap}>
          <a
            href={siteConfig.links.bubilet}
            target="_blank"
            rel="noopener noreferrer"
            className={`editorial-link ${styles.cta}`}
            data-cursor="BİLET ↗"
            aria-label="Etkinlikleri Bubilet’te gör (yeni sekme)"
          >
            {siteConfig.ticket.cta}
          </a>
        </MagneticElement>
      </div>
    </section>
  );
}
