import { ReleaseActions } from "@/components/music/ReleaseActions";
import type { SpotifyRelease } from "@/lib/spotify/types";
import { isDirectSpotifyAlbumUrl } from "@/lib/spotify/validate-links";
import styles from "./AlbumCard.module.css";

type Props = {
  album: SpotifyRelease;
};

export function AlbumCard({ album }: Props) {
  const typeLabel =
    album.albumType === "album"
      ? "Albüm"
      : album.albumType === "compilation"
        ? "Derleme"
        : album.albumType === "ep"
          ? "EP"
          : "Tekli";

  const safe =
    album.verified === true &&
    isDirectSpotifyAlbumUrl(album.spotifyUrl, album.spotifyId || album.id);

  const body = (
    <>
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
        {safe ? (
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        ) : (
          <span className={styles.unverified}>BAĞLANTI DOĞRULANAMADI</span>
        )}
      </p>
    </>
  );

  if (!safe) {
    return <div className={styles.card}>{body}</div>;
  }

  return (
    <div className={styles.card}>
      <a
        href={album.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label={`${album.name} albümünü Spotify’da aç`}
      >
        {body}
      </a>
      <ReleaseActions
        id={album.id}
        type="album"
        name={album.name}
        spotifyUrl={album.spotifyUrl}
      />
    </div>
  );
}
