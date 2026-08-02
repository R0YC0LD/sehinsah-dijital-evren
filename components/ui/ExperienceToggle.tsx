"use client";

import { useEffect, useState } from "react";
import styles from "./ExperienceToggle.module.css";

const STORAGE_KEY = "sehinsah-chaos-mode";

type Props = {
  reducedMotion?: boolean;
};

export function ExperienceToggle({ reducedMotion = false }: Props) {
  const [chaosMode, setChaosMode] = useState(false);
  const [pristine, setPristine] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setChaosMode(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const active = chaosMode && !reducedMotion;
    root.dataset.chaos = active ? "true" : "false";
    try {
      localStorage.setItem(STORAGE_KEY, String(chaosMode));
    } catch {
      /* ignore */
    }
  }, [chaosMode, reducedMotion]);

  return (
    <label className={`experience-toggle ${styles.toggle}`}>
      <span className="sr-only">Kaos modunu aç veya kapat</span>
      <input
        className={`mode-toggle ${styles.modeToggle} ${pristine ? "pristine" : ""}`}
        type="checkbox"
        name="toggle"
        checked={chaosMode}
        onChange={(e) => {
          setPristine(false);
          setChaosMode(e.target.checked);
        }}
      />
      <span className={styles.label} aria-hidden="true">
        {chaosMode ? "KAOS" : "SADE"}
      </span>
    </label>
  );
}
