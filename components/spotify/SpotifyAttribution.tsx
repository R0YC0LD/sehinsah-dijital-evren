import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./SpotifyAttribution.module.css";

export function SpotifyAttribution() {
  return (
    <p className={styles.attr}>
      {siteConfig.music.attribution}{" "}
      <ExternalLink href={siteConfig.spotify.artistUrl} className={styles.link}>
        Spotify ↗
      </ExternalLink>
    </p>
  );
}
