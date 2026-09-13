"use client";

import { useState } from "react";
import { assetPath } from "@/lib/paths/assetPath";
import styles from "./ProductRevealImage.module.css";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

const REVEAL_SRC = "/media/store/sehinsah-reveal.png";

export function ProductRevealImage({ src, alt, className }: Props) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={`${styles.wrap} ${active ? styles.active : ""} ${className || ""}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetPath(src)} alt={alt} className={styles.base} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(REVEAL_SRC)}
        alt=""
        aria-hidden="true"
        className={`${styles.reveal} ${active ? styles.revealActive : ""}`}
      />
    </div>
  );
}
