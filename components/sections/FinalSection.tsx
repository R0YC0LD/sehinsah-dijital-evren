"use client";

import { Footer } from "@/components/layout/Footer";
import { MediaImage } from "@/components/ui/MediaImage";
import { siteConfig } from "@/data/site";
import styles from "./FinalSection.module.css";

type Props = {
  onBackTop: () => void;
};

export function FinalSection({ onBackTop }: Props) {
  return (
    <section
      id="sonsuzluk"
      className={styles.section}
      data-section="sonsuzluk"
      aria-label="Sonsuzluk"
    >
      <div className={styles.stage}>
        <MediaImage
          src={siteConfig.media.falling}
          alt=""
          width={1000}
          height={1000}
          className={styles.ghost}
        />

        <h2 className={`display ${styles.lineOne}`}>{siteConfig.final.lineOne}</h2>

        <button
          type="button"
          className={`editorial-link ${styles.back}`}
          onClick={onBackTop}
          data-cursor="AÇ"
        >
          {siteConfig.final.backToTop}
        </button>
      </div>

      <Footer onBackTop={onBackTop} />
    </section>
  );
}
