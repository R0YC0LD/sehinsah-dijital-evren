"use client";

import Image from "next/image";
import Link from "next/link";
import { ReleaseActions } from "@/components/music/ReleaseActions";
import { useQuickViewModal } from "@/hooks/useQuickViewModal";
import { isEpRelease } from "@/lib/spotify/normalize";
import type { SpotifyRelease } from "@/lib/spotify/types";
import styles from "./AlbumQuickView.module.css";

type Props = {
  album: SpotifyRelease;
  pageHref: string;
  onClose: () => void;
};

export function AlbumQuickView({ album, pageHref, onClose }: Props) {
  useQuickViewModal(onClose);

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

        <div className={styles.cover}>
          {album.imageUrl ? (
            <Image
              src={album.imageUrl}
              alt={`${album.name} albüm kapağı`}
              fill
              sizes="(max-width: 719px) 90vw, 340px"
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
          <Link href={pageHref} className={styles.page} onClick={onClose}>
            KLİP, SÖZ VE DETAYLAR →
          </Link>
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
