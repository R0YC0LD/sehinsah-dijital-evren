"use client";

import { useRef } from "react";
import gsap from "gsap";
import { EntropyBrain } from "@/components/easteregg/EntropyBrain";
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
      rotateY: px * 3,
      rotateX: -py * 2.5,
      scale: 1.012,
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
    <section id="sahne" className={`section-shell ${styles.section}`} aria-label="Sahne">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={`display ${styles.ghost}`}>SAHNE</span>
      </div>

      <div className={`section-content ${styles.content}`}>
        <p className="meta-label">{siteConfig.tickets.meta}</p>
        <h2 className={`display ${styles.title}`}>{siteConfig.tickets.title}</h2>
        <p className={styles.subtitle}>{siteConfig.tickets.subtitle}</p>

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
          />
        </a>

        <a
          href={siteConfig.tickets.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`editorial-link ${styles.cta}`}
        >
          {siteConfig.tickets.cta}
        </a>
      </div>
      <EntropyBrain id="stage-poster-edge" />
    </section>
  );
}
