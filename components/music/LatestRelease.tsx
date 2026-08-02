import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import type { SpotifyRelease } from "@/lib/spotify/types";
import styles from "./LatestRelease.module.css";

type Props = {
  release: SpotifyRelease | null;
};

export function LatestRelease({ release }: Props) {
  if (!release) {
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

  const typeLabel =
    release.albumType === "album"
      ? "Albüm"
      : release.albumType === "compilation"
        ? "Derleme"
        : release.albumType === "ep"
          ? "EP"
          : "Tekli";

  return (
    <article className={styles.card}>
      <p className="meta-label">{siteConfig.music.latestTitle}</p>
      <a
        href={release.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.coverLink}
        aria-label={`${release.name} albümünü Spotify’da aç`}
      >
        {release.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.imageUrl}
            alt={`${release.name} albüm kapağı`}
            width={640}
            height={640}
            className={styles.cover}
            loading="lazy"
          />
        ) : (
          <div className={`display ${styles.fallback}`}>{release.name}</div>
        )}
      </a>
      <h3 className={styles.name}>{release.name}</h3>
      <p className={styles.meta}>
        {release.releaseYear} · {typeLabel} · {release.totalTracks} parça
      </p>
      <ExternalLink href={release.spotifyUrl} className={styles.cta}>
        {siteConfig.music.listenLabel}
      </ExternalLink>
    </article>
  );
}
