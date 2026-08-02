"use client";

import { entropyConfig } from "@/data/entropy";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import styles from "./EntropyMenuProgress.module.css";

export function EntropyMenuProgress() {
  const { count, total, completed, openVideoReplay } = useEntropy();

  if (!entropyConfig.showMenuProgressAfterFirstCollect) return null;
  if (count < 1 && !completed) return null;

  return (
    <div className={styles.wrap} aria-live="polite">
      <span className={styles.label}>
        {completed ? "ENTROPİ TAMAMLANDI" : `ENTROPİ ${count}/${total}`}
      </span>
      {completed ? (
        <button type="button" className={styles.replay} onClick={openVideoReplay}>
          VİDEOYU TEKRAR İZLE
        </button>
      ) : null}
    </div>
  );
}
