"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/data/site";
import type { SpotifyTrack } from "@/lib/spotify/types";
import { isDirectSpotifyTrackUrl } from "@/lib/spotify/validate-links";
import styles from "./RandomTrackPicker.module.css";

const STORAGE_KEY = "sehinsah-last-random-track";

type Props = {
  tracks: SpotifyTrack[];
};

export function RandomTrackPicker({ tracks }: Props) {
  const pool = useMemo(
    () =>
      tracks.filter(
        (t) =>
          t.verified &&
          t.containsTargetArtist &&
          isDirectSpotifyTrackUrl(t.spotifyUrl, t.spotifyId || t.id),
      ),
    [tracks],
  );

  const [pick, setPick] = useState<SpotifyTrack | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!pool.length) return null;

  const choose = () => {
    let last = "";
    try {
      last = localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      /* ignore */
    }
    const candidates = pool.length > 1 ? pool.filter((t) => t.id !== last) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setPick(next);
    setRevealed(true);
    try {
      localStorage.setItem(STORAGE_KEY, next.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={choose}>
        {siteConfig.music.randomTitle}
      </button>

      <div
        className={`${styles.panel} ${revealed ? styles.open : ""}`}
        aria-live="polite"
      >
        {pick ? (
          <>
            <div className={styles.scan} aria-hidden="true" />
            {pick.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pick.imageUrl}
                alt=""
                width={96}
                height={96}
                className={styles.cover}
              />
            ) : null}
            <div>
              <p className={styles.name}>{pick.name}</p>
              <p className={styles.meta}>
                {pick.albumName}
                {pick.albumName ? " · " : ""}
                {pick.albumId ? "" : ""}
              </p>
              <a
                href={pick.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cta}
                aria-label={`${pick.name} parçasını Spotify’da aç`}
              >
                {siteConfig.music.randomCta}
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
