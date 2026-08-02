"use client";

import { entropyConfig, getEntropyToastCopy } from "@/data/entropy";
import { assetPath } from "@/lib/paths/assetPath";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import styles from "./EntropyToast.module.css";

export function EntropyToast() {
  const { toast, total } = useEntropy();
  if (!toast) return null;

  const copy = getEntropyToastCopy(toast.count, total);
  const pct = Math.min(100, Math.round((toast.count / total) * 100));

  return (
    <div
      className={`${styles.toast} ${toast.visible ? styles.visible : ""}`}
      role="status"
      aria-live="polite"
      data-analytics="entropy_progress"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.icon}
        src={assetPath(entropyConfig.iconSrc)}
        alt=""
        width={28}
        height={28}
        aria-hidden="true"
      />
      <div className={styles.copy}>
        <span className={styles.title}>{copy.title}</span>
        <span className={styles.counter}>{copy.counter}</span>
        <span className={styles.subtitle}>{copy.subtitle}</span>
      </div>
      <div className={styles.progress} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
