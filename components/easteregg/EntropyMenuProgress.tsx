"use client";

import { entropyConfig } from "@/data/entropy";
import { useDeepEntropy } from "@/components/easteregg/DeepEntropyProvider";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import styles from "./EntropyMenuProgress.module.css";

export function EntropyMenuProgress() {
  const { count, total, completed, openVideoReplay } = useEntropy();
  const deep = useDeepEntropy();

  if (!entropyConfig.showMenuProgressAfterFirstCollect) return null;
  if (count < 1 && !completed && !deep.unlocked) return null;

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
      {deep.unlocked ? (
        deep.completed ? (
          <button type="button" className={styles.replay} onClick={deep.openReward}>
            ENTROPİ ARŞİVİ
          </button>
        ) : (
          <span className={styles.label}>DERİN ENTROPİ {deep.count}/{deep.total}</span>
        )
      ) : null}
    </div>
  );
}
