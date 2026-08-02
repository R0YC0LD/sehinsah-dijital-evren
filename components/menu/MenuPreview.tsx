"use client";

import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import styles from "./MenuPreview.module.css";

type Props = {
  activeId: string;
  latestCover: string | null;
};

type PreviewState = {
  src: string;
  label: string;
  mode: "image" | "fallback";
};

function resolvePreview(activeId: string, latestCover: string | null): PreviewState {
  const item = siteConfig.nav.find((n) => n.id === activeId) ?? siteConfig.nav[0];
  let src = assetPath(siteConfig.media.falling);
  let label = item.label;
  let mode: "image" | "fallback" = "image";

  if (item.preview === "bubilet") src = assetPath(siteConfig.media.bubilet);
  if (item.preview === "instagram") src = assetPath(siteConfig.media.instagram);
  if (item.preview === "music") {
    if (latestCover) {
      src = latestCover;
      label = "SON YAYIN";
    } else {
      src = "";
      label = "MÜZİK";
      mode = "fallback";
    }
  }

  return { src, label, mode };
}

export function MenuPreview({ activeId, latestCover }: Props) {
  const [current, setCurrent] = useState(() => resolvePreview(activeId, latestCover));
  const [previous, setPrevious] = useState<PreviewState | null>(null);
  const [fading, setFading] = useState(false);
  const currentRef = useRef(current);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    const resolved = resolvePreview(activeId, latestCover);
    const prev = currentRef.current;
    if (resolved.src === prev.src && resolved.label === prev.label) return;

    setPrevious(prev);
    setCurrent(resolved);
    setFading(true);
    const t = window.setTimeout(() => {
      setPrevious(null);
      setFading(false);
    }, 240);
    return () => window.clearTimeout(t);
  }, [activeId, latestCover]);

  return (
    <div className={styles.preview} aria-hidden="true">
      <p className={styles.caption}>{current.label}</p>
      <div className={`${styles.frame} ${fading ? styles.fading : ""}`}>
        {previous ? (
          previous.mode === "fallback" ? (
            <div className={`display ${styles.fallback} ${styles.layerPrev}`}>MÜZİK</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previous.src} alt="" className={`${styles.image} ${styles.layerPrev}`} />
          )
        ) : null}

        {current.mode === "fallback" ? (
          <div className={`display ${styles.fallback} ${styles.layerCurr}`}>MÜZİK</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.src} alt="" className={`${styles.image} ${styles.layerCurr}`} />
        )}
      </div>
    </div>
  );
}
