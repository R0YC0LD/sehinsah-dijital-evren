"use client";

import { useChaos } from "@/components/providers/ChaosProvider";
import styles from "./ChaosToggle.module.css";

type Props = {
  className?: string;
};

export function ChaosToggle({ className = "" }: Props) {
  const { chaos, pristine, toggle } = useChaos();

  return (
    <label className={`${styles.toggle} ${className}`}>
      <span className="sr-only">Kaos modunu aç veya kapat</span>
      <input
        className={`${styles.input} ${pristine ? "pristine" : ""}`}
        type="checkbox"
        checked={chaos}
        onChange={(e) => toggle(e.target.checked)}
      />
      <span className={styles.label} aria-hidden="true">
        {chaos ? "KAOS" : "SADE"}
      </span>
    </label>
  );
}
