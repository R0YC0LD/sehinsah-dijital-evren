"use client";

import { useEffect, useId, useRef } from "react";
import { useMusicStartGate } from "@/hooks/useMusicStartGate";
import { siteConfig } from "@/data/site";
import styles from "./MusicStartGate.module.css";

export function MusicStartGate() {
  const {
    visible,
    closing,
    starting,
    retry,
    ready,
    handleStartExperience,
    handleSilentContinue,
  } = useMusicStartGate();
  const titleId = useId();
  const descId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible || closing) return;
    buttonRef.current?.focus();
  }, [visible, closing, retry]);

  useEffect(() => {
    if (!visible || closing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible, closing]);

  if (!siteConfig.audioGate.enabled || !visible) return null;

  return (
    <div
      className={`${styles.gate} ${closing ? styles.gateClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={styles.panel}>
        <p className={styles.eyebrow}>SESLİ DENEYİMİ BAŞLAT</p>
        <h2 id={titleId} className={styles.brand}>
          ŞEHİNŞAH
        </h2>
        <p id={descId} className={styles.copy}>
          Bir kez dokun. Müzik başlasın, düşüş ritme bağlansın.
        </p>
        {retry ? (
          <p className={styles.retry} role="status">
            Müzik başlatılamadı. Tekrar dene veya sessiz devam et.
          </p>
        ) : null}
        <div className={styles.actions}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.startButton}
            onClick={handleStartExperience}
            disabled={starting || !ready}
          >
            {starting
              ? "BAŞLATILIYOR…"
              : !ready
                ? "HAZIRLANIYOR…"
                : retry
                  ? "MÜZİĞİ BAŞLAT"
                  : "DENEYİMİ BAŞLAT"}
          </button>
          <button type="button" className={styles.silent} onClick={handleSilentContinue}>
            SESSİZ DEVAM ET
          </button>
        </div>
        <p className={styles.note}>Müzik Spotify üzerinden oynatılır.</p>
      </div>
    </div>
  );
}
