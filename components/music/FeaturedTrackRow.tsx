"use client";

import type { FeaturedTrack } from "@/data/featured-tracks";
import { siteConfig } from "@/data/site";
import styles from "./FeaturedTrackRow.module.css";

type Props = {
  index: string;
  track: FeaturedTrack;
  active: boolean;
  enabled: boolean;
  isTouch: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onToggle: () => void;
};

export function FeaturedTrackRow({
  index,
  track,
  active,
  enabled,
  isTouch,
  onHoverStart,
  onHoverEnd,
  onToggle,
}: Props) {
  const hasPreview = Boolean(track.previewSrc);
  const duration = track.previewDuration || siteConfig.audioPreview.defaultDuration;

  return (
    <li
      className={`${styles.row} ${active ? styles.active : ""}`}
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
    >
      <span className={styles.index}>{index}</span>
      <a
        href={track.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.title}
        aria-label={`${track.title} parçasını Spotify’da aç`}
      >
        {track.title}
      </a>

      <span className={styles.meta}>
        {hasPreview ? `${String(duration).padStart(2, "0")} sn` : siteConfig.music.noPreview}
      </span>

      {isTouch && hasPreview ? (
        <button
          type="button"
          className={styles.play}
          aria-label={`${track.title} önizlemesini çal veya durdur`}
          aria-pressed={active}
          onClick={onToggle}
          disabled={!enabled}
        >
          {active ? "DURDUR" : enabled ? "ÇAL" : "SES"}
        </button>
      ) : (
        <span className={styles.arrow} aria-hidden="true">
          ↗
        </span>
      )}
    </li>
  );
}
