"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BioTeaser.module.css";

const STOPPED_KEY = "sehinsah-bio-teaser-stopped-v3";

function isStopped(): boolean {
  try {
    return sessionStorage.getItem(STOPPED_KEY) === "1";
  } catch {
    return false;
  }
}

function stopForever() {
  try {
    sessionStorage.setItem(STOPPED_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * "Ufuk Yıkılmaz kimdir?" kartı. Eskiden sayfanın üstünde süreli açılır penceredi ve içeriğin
 * (butonların, yazıların) üstüne biniyordu; artık sayfa akışının içinde, sonda durur.
 */
export function BioTeaser() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isStopped());
  }, []);

  if (dismissed) return null;

  return (
    <aside className={styles.wrap} aria-label="Şehinşah kimdir?">
      <button
        type="button"
        className={styles.close}
        onClick={() => {
          stopForever();
          setDismissed(true);
        }}
        aria-label="Kartı gizle"
      >
        ✕
      </button>
      <button
        type="button"
        className={styles.body}
        onClick={() => {
          stopForever();
          router.push("/hakkinda");
        }}
      >
        <p className={styles.eyebrow}>MERAK ETTİN Mİ?</p>
        <p className={styles.question}>Ufuk Yıkılmaz kimdir?</p>
        <span className={styles.cta}>HİKAYEYİ OKU →</span>
      </button>
    </aside>
  );
}
