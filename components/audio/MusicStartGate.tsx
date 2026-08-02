"use client";

import { useEffect, useId, useRef } from "react";
import { useMusicStartGate } from "@/hooks/useMusicStartGate";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
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
  const { registerHostElement, gateOpen } = useSpotifyPlayback();
  const titleId = useId();
  const descId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerHostElement(hostRef.current);
    return () => registerHostElement(null);
  }, [registerHostElement]);

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

  if (!siteConfig.audioGate.enabled) return null;

  return (
    <>
      {/* Persistent Spotify host: visible in-gate while open, tiny live host after close. */}
      <div
        ref={hostRef}
        id="sehinsah-spotify-gate-host"
        className={gateOpen ? styles.embedDockLive : styles.embedDockPersistent}
        aria-hidden="true"
      />

      {visible ? (
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
                Hazırlanıyor… Tekrar dokun; müzik Spotify üzerinden açılacak.
              </p>
            ) : null}

            {/* Spacer matching the live dock that sits above the gate panel via fixed pos */}
            <div className={styles.embedSpacer} aria-hidden="true" />

            <div className={styles.actions}>
              <button
                ref={buttonRef}
                type="button"
                className={styles.startButton}
                onClick={handleStartExperience}
                disabled={starting}
              >
                {starting
                  ? "BAŞLATILIYOR…"
                  : !ready
                    ? "HAZIRLANIYOR… (yine de dene)"
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
      ) : null}
    </>
  );
}
