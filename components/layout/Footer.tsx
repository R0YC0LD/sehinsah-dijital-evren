import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={`display ${styles.brand}`}>{siteConfig.artistName}</p>
      <nav className={styles.links} aria-label="Footer">
        <a href="#muzik">MÜZİK</a>
        <ExternalLink href={siteConfig.links.bubilet}>BUBİLET ↗</ExternalLink>
        <ExternalLink href={siteConfig.links.instagram}>INSTAGRAM ↗</ExternalLink>
        <ExternalLink href={siteConfig.links.spotifyArtist}>SPOTIFY ↗</ExternalLink>
      </nav>
    </footer>
  );
}
