"use client";

import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import styles from "./MenuPreview.module.css";

type Props = {
  activeId: string;
  latestCover: string | null;
};

export function MenuPreview({ activeId, latestCover }: Props) {
  const item = siteConfig.nav.find((n) => n.id === activeId) ?? siteConfig.nav[0];

  let src = assetPath(siteConfig.media.falling);
  let label = item.label;

  if (item.preview === "bubilet") src = assetPath(siteConfig.media.bubilet);
  if (item.preview === "instagram") src = assetPath(siteConfig.media.instagram);
  if (item.preview === "music") {
    src = latestCover || "";
    label = latestCover ? "SON YAYIN" : "MÜZİK";
  }

  return (
    <div className={styles.preview} aria-hidden="true">
      <p className={styles.caption}>{label}</p>
      <div className={styles.frame}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className={styles.image} />
        ) : (
          <div className={`display ${styles.fallback}`}>MÜZİK</div>
        )}
      </div>
    </div>
  );
}
