"use client";

import styles from "./ScrollProgress.module.css";

type Props = {
  progress: number;
  indexLabel: string;
};

export function ScrollProgress({ progress, indexLabel }: Props) {
  return (
    <div className={styles.rail} aria-hidden="true">
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ height: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
      <span className={styles.label}>{indexLabel}</span>
    </div>
  );
}
