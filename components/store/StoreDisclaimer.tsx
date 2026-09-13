"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./StoreDisclaimer.module.css";

const STORAGE_KEY = "sehinsah-store-disclaimer-v1";
const SHOW_DELAY_MS = 950;

export function StoreDisclaimer() {
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [visible]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={styles.panel}>
        <p className={styles.eyebrow}>UYARI</p>
        <h2 id={titleId} className={`display ${styles.title}`}>
          TASLAK MAĞAZA
        </h2>
        <p id={descId} className={styles.copy}>
          Buradaki ürünler gerçek ürünler değildir; taslak/konsept olarak durmaktadır. Bu sayfa
          üzerinden herhangi bir satış yapılmamakta ve maddi bir gelir sağlanmamaktadır.
        </p>
        <button ref={closeRef} type="button" className={styles.confirm} onClick={dismiss}>
          ANLADIM
        </button>
      </div>
    </div>
  );
}
