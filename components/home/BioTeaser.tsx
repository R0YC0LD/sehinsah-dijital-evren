"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BioTeaser.module.css";

const COUNT_KEY = "sehinsah-bio-teaser-count-v2";
const STOPPED_KEY = "sehinsah-bio-teaser-stopped-v2";
const MAX_SHOWS = 6;
const INITIAL_DELAY_MS = 4000;
const VISIBLE_MS = 10000;
const HIDDEN_MS = 60000;

function readCount(): number {
  try {
    return Number(sessionStorage.getItem(COUNT_KEY) || "0");
  } catch {
    return 0;
  }
}

function bumpCount(): number {
  const next = readCount() + 1;
  try {
    sessionStorage.setItem(COUNT_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
}

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

export function BioTeaser() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isStopped()) return;

    const scheduleShow = (delay: number) => {
      timerRef.current = window.setTimeout(() => {
        if (isStopped()) return;
        const count = bumpCount();
        setVisible(true);

        timerRef.current = window.setTimeout(() => {
          setVisible(false);
          if (count >= MAX_SHOWS) {
            stopForever();
            return;
          }
          scheduleShow(HIDDEN_MS);
        }, VISIBLE_MS);
      }, delay);
    };

    scheduleShow(INITIAL_DELAY_MS);

    return () => window.clearTimeout(timerRef.current);
  }, []);

  const dismiss = () => {
    window.clearTimeout(timerRef.current);
    stopForever();
    setVisible(false);
  };

  const go = () => {
    window.clearTimeout(timerRef.current);
    stopForever();
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
