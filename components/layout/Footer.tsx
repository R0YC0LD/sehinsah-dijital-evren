import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={`display ${styles.brand}`}>{siteConfig.artistName}</p>
      <nav className={styles.links} aria-label="Footer">
        <ExternalLink href={siteConfig.spotify.artistUrl}>SPOTIFY ↗</ExternalLink>
        <ExternalLink href={siteConfig.tickets.url}>BUBİLET ↗</ExternalLink>
        <ExternalLink href={siteConfig.instagram.url}>INSTAGRAM ↗</ExternalLink>
        <a href="#hero">{siteConfig.final.backToTop}</a>
      </nav>
    </footer>
  );
}
