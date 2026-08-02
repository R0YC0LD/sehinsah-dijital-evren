"use client";

import { ExperienceToggle } from "@/components/ui/ExperienceToggle";
import { siteConfig } from "@/data/site";
import styles from "./ControlDock.module.css";

type Props = {
  indexLabel: string;
  reducedMotion?: boolean;
};

export function ControlDock({ indexLabel, reducedMotion }: Props) {
  const hasAudio = Boolean(siteConfig.audioSrc);

  return (
    <div className={styles.dock}>
      <span className={styles.chaosLabel}>KAOS</span>
      <ExperienceToggle reducedMotion={reducedMotion} />
      <span className={styles.index}>{indexLabel}</span>
      {hasAudio ? (
        <button type="button" className={styles.audio} aria-label="Ses kontrolü">
          SES
        </button>
      ) : null}
    </div>
  );
}
