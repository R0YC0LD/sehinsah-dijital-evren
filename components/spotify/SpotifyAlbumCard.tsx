import type { NormalizedAlbum } from "@/lib/spotify/types";
import styles from "./SpotifyAlbumCard.module.css";

type Props = {
  album: NormalizedAlbum;
};

export function SpotifyAlbumCard({ album }: Props) {
  const typeLabel =
    album.albumType === "album" ? "Albüm" : album.albumType === "single" ? "Tekli" : album.albumType;

  return (
    <a
      href={album.spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      aria-label={`${album.name} albümünü Spotify’da aç`}
    >
      <div className={styles.cover}>
        {album.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.imageUrl}
            alt={`${album.name} albüm kapağı`}
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>Kapak bulunamadı</div>
        )}
      </div>
      <div className={styles.meta}>
        <p className={styles.name}>{album.name}</p>
        <p className={styles.detail}>
          <span>{album.releaseYear}</span>
          <span aria-hidden="true"> · </span>
          <span>{typeLabel}</span>
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </p>
      </div>
    </a>
  );
}
