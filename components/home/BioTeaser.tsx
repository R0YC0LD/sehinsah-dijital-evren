"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BioTeaser.module.css";

const STORAGE_KEY = "sehinsah-bio-teaser-v1";
const SHOW_DELAY_MS = 4000;

export function BioTeaser() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const go = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    router.push("/hakkinda");
  };

  if (!visible) return null;

  return (
    <div className={styles.wrap} role="dialog" aria-label="Şehinşah kimdir?">
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Kapat">
        ✕
      </button>
      <button type="button" className={styles.body} onClick={go}>
        <p className={styles.eyebrow}>MERAK ETTİN Mİ?</p>
        <p className={styles.question}>Ufuk Yıkılmaz kimdir?</p>
        <span className={styles.cta}>HİKAYEYİ OKU →</span>
      </button>
    </div>
  );
}
