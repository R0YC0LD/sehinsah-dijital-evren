import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import type { SpotifyRelease } from "@/lib/spotify/types";
import { isDirectSpotifyAlbumUrl } from "@/lib/spotify/validate-links";
import styles from "./LatestRelease.module.css";

type Props = {
  release: SpotifyRelease | null;
};

function isRecent(date: string) {
  if (!date) return false;
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return false;
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 45;
}

export function LatestRelease({ release }: Props) {
  if (!release || !release.verified) {
    return (
      <div className={`panel ${styles.box}`}>
        <p className="meta-label">{siteConfig.music.latestTitle}</p>
        <p className={styles.empty}>{siteConfig.music.fallbackMessage}</p>
        <ExternalLink href={siteConfig.links.spotifyArtist} className={styles.cta}>
          {siteConfig.music.fallbackCta}
        </ExternalLink>
      </div>
    );
  }

  const safe = isDirectSpotifyAlbumUrl(
    release.spotifyUrl,
    release.spotifyId || release.id,
  );

  const typeLabel =
    release.albumType === "album"
      ? "Albüm"
      : release.albumType === "compilation"
        ? "Derleme"
        : release.albumType === "ep"
          ? "EP"
          : "Tekli";

  const cover = (
    <>
      {release.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={release.imageUrl}
          alt={`${release.name} albüm kapağı`}
          width={640}
          height={640}
          className={styles.cover}
          loading="eager"
          fetchPriority="high"
        />
      ) : (
        <div className={`display ${styles.fallback}`}>{release.name}</div>
      )}
    </>
  );

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <p className="meta-label">{siteConfig.music.latestTitle}</p>
        {isRecent(release.releaseDate) ? <span className={styles.badge}>YENİ</span> : null}
      </div>

      {safe ? (
        <a
          href={release.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.coverLink}
          aria-label={`${release.name} albümünü Spotify’da aç`}
        >
          {cover}
        </a>
      ) : (
        <div className={styles.coverLink}>{cover}</div>
      )}

      <h3 className={styles.name}>{release.name}</h3>
      <p className={styles.meta}>
        {release.releaseYear} · {typeLabel}
        {release.totalTracks ? ` · ${release.totalTracks} parça` : ""}
      </p>
      {safe ? (
        <ExternalLink href={release.spotifyUrl} className={styles.cta}>
          {siteConfig.music.listenLabel}
        </ExternalLink>
      ) : (
        <p className={styles.empty}>BAĞLANTI DOĞRULANAMADI</p>
      )}
    </article>
  );
}
