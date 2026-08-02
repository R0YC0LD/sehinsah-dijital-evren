"use client";

import { assetPath } from "@/lib/paths/assetPath";
import styles from "./VideoLoadingScreen.module.css";

type Props = {
  visible: boolean;
  reduced: boolean;
};

export function VideoLoaderFallback({ visible, reduced }: Props) {
  if (!visible) return null;
  const poster = assetPath("/media/loading/sehinsah-entropi-loader-poster.webp");

  return (
    <div className={`${styles.fallback} ${reduced ? styles.fallbackReduced : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" className={styles.poster} width={1280} height={720} />
      <span className={styles.fallbackWipe} />
    </div>
  );
}
