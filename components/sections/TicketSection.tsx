"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import gsap from "gsap";
import { MagneticElement } from "@/components/effects/MagneticElement";
import { siteConfig } from "@/data/site";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./TicketSection.module.css";

export function TicketSection() {
  const posterRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();
  const [imgOk, setImgOk] = useState(true);

  const onMove = (e: React.PointerEvent) => {
    if (isTouch || reduced || !posterRef.current) return;
    const rect = posterRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(posterRef.current, {
      rotateY: px * 10,
      rotateX: -py * 8,
      scale: 1.02,
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (labelRef.current) {
      gsap.to(labelRef.current, {
        x: px * 28,
        y: py * 28,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
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
    if (labelRef.current) {
      gsap.to(labelRef.current, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: "power2.out",
      });
    }
  };

  return (
    <section
      id="sahne"
      className={styles.section}
      data-section="sahne"
      aria-label="Sahne"
    >
      <div className={styles.copy}>
        <p className={styles.index}>04 — SAHNE</p>
        <h2 className={`display ${styles.title}`}>{siteConfig.ticket.title}</h2>
        <p className={styles.subtitle}>{siteConfig.ticket.subtitle}</p>
        <p className={styles.note}>{siteConfig.ticket.note}</p>
      </div>

      <div className={styles.posterScene}>
        <span className={styles.ghost} aria-hidden="true" />
        <span className={`display ${styles.bigIndex}`} aria-hidden="true">
          04
        </span>

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
          {imgOk ? (
            <Image
              src={siteConfig.media.bubilet}
              alt="Şehinşah Bubilet etkinlik afişi"
              width={960}
              height={960}
              className={styles.image}
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className={styles.fallback}>ETKİNLİK AFİŞİ</span>
          )}
          <span ref={labelRef} className={styles.floatLabel} aria-hidden="true">
            BİLET AL
          </span>
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
