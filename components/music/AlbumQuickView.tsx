"use client";

import { useEffect } from "react";
import { ReleaseActions } from "@/components/music/ReleaseActions";
import { isEpRelease } from "@/lib/spotify/normalize";
import type { SpotifyRelease } from "@/lib/spotify/types";
import styles from "./AlbumQuickView.module.css";

type Props = {
  album: SpotifyRelease;
  onClose: () => void;
};

export function AlbumQuickView({ album, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const typeLabel =
    album.albumType === "album"
      ? "Albüm"
      : album.albumType === "compilation"
        ? "Derleme"
        : album.albumType === "ep" || isEpRelease(album)
          ? "EP"
          : "Tekli";

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={album.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          ✕
        </button>

        <div className={styles.cover} style={{ viewTransitionName: `album-cover-${album.id}` }}>
          {album.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.imageUrl}
              alt={`${album.name} albüm kapağı`}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder}>Kapak bulunamadı</div>
          )}
        </div>

        <div className={styles.info}>
          <p className="meta-label">
            {album.releaseYear} · {typeLabel}
          </p>
          <h3 className={`display ${styles.name}`}>{album.name}</h3>
          <a
            href={album.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`editorial-link ${styles.cta}`}
          >
            SPOTIFY&apos;DA AÇ ↗
          </a>
          <ReleaseActions
            id={album.id}
            type="album"
            name={album.name}
            spotifyUrl={album.spotifyUrl}
          />
        </div>
      </div>
    </div>
  );
}
