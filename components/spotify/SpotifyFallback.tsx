import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./SpotifyFallback.module.css";

export function SpotifyFallback() {
  return (
    <div className={styles.box}>
      <p>{siteConfig.music.fallbackMessage}</p>
      <ExternalLink
        href={siteConfig.spotify.artistUrl}
        className="editorial-link"
        aria-label="Spotify’da aç (yeni sekme)"
      >
        {siteConfig.music.openCta}
      </ExternalLink>
    </div>
  );
}
