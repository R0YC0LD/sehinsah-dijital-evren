"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MediaImage } from "@/components/ui/MediaImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
      rotateY: px * 6,
      rotateX: -py * 5,
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
      duration: 0.45,
      ease: "power2.out",
    });
  };

  return (
    <section id="sahne" className={styles.section} aria-label="Sahne">
      <SectionHeading
        title={siteConfig.tickets.title}
        subtitle={siteConfig.tickets.subtitle}
      />

      <div className={styles.scene}>
        <a
          ref={posterRef}
          href={siteConfig.tickets.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.poster}
          aria-label="Bubilet’te etkinlikleri görüntüle (yeni sekme)"
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

        <a
          href={siteConfig.tickets.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`editorial-link ${styles.cta}`}
          aria-label="Etkinlikleri Bubilet’te gör (yeni sekme)"
        >
          {siteConfig.tickets.cta}
        </a>
      </div>
    </section>
  );
}
