"use client";

import Image from "next/image";
import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/data/site";
import styles from "./FinalSection.module.css";

type Props = {
  onBackTop: () => void;
};

export function FinalSection({ onBackTop }: Props) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <section
      id="sonsuzluk"
      className={styles.section}
      data-section="sonsuzluk"
      aria-label="Sonsuzluk"
    >
      <div className={styles.stage}>
        {imgOk ? (
          <Image
            src={siteConfig.media.falling}
            alt=""
            width={1000}
            height={1000}
            className={styles.ghost}
            onError={() => setImgOk(false)}
            aria-hidden="true"
          />
        ) : null}

        <h2 className={`display ${styles.lineOne}`}>{siteConfig.final.lineOne}</h2>
        <p className={styles.lineTwo}>{siteConfig.final.lineTwo}</p>

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
