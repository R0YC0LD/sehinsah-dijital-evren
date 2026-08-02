import type { SpotifyRelease } from "@/lib/spotify/types";
import styles from "./AlbumCard.module.css";

type Props = {
  album: SpotifyRelease;
};

export function AlbumCard({ album }: Props) {
  const typeLabel = album.albumType === "album" ? "Albüm" : "Tekli";

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
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>Kapak bulunamadı</div>
        )}
      </div>
      <p className={styles.name}>{album.name}</p>
      <p className={styles.meta}>
        <span>
          {album.releaseYear} · {typeLabel}
        </span>
        <span className={styles.arrow} aria-hidden="true">
          ↗
        </span>
      </p>
    </a>
  );
}
