import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./Footer.module.css";

type Props = {
  onBackTop?: () => void;
};

export function Footer({ onBackTop }: Props) {
  return (
    <footer className={styles.footer}>
      <p className={`display ${styles.name}`}>{siteConfig.footer.brand}</p>

      <nav className={styles.links} aria-label="Footer bağlantıları">
        <ExternalLink
          href={siteConfig.links.bubilet}
          className="editorial-link"
          data-cursor="BİLET ↗"
          aria-label="Bubilet etkinlik sayfası (yeni sekme)"
        >
          BUBİLET <span className="arrow">↗</span>
        </ExternalLink>
        <ExternalLink
          href={siteConfig.links.instagram}
          className="editorial-link"
          data-cursor="GİT ↗"
          aria-label="Instagram profili (yeni sekme)"
        >
          INSTAGRAM <span className="arrow">↗</span>
        </ExternalLink>
        <a
          href="#bosluk"
          className="editorial-link"
          data-cursor="AÇ"
          onClick={(e) => {
            if (onBackTop) {
              e.preventDefault();
              onBackTop();
            }
          }}
        >
          {siteConfig.final.backToTop}
        </a>
      </nav>
    </footer>
  );
}
