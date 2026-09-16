"use client";

import Link from "next/link";
import { EntropyBrain } from "@/components/easteregg/EntropyBrain";
import { DesignerCredit } from "@/components/layout/DesignerCredit";
import { PlatformLinks } from "@/components/platforms/PlatformLinks";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import { useMagnetic } from "@/hooks/useMagnetic";
import styles from "./Footer.module.css";

export function Footer() {
  const musicRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, maxOffset: 8, radius: 1.6 });
  const aboutRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, maxOffset: 8, radius: 1.6 });
  const bubiletRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, maxOffset: 8, radius: 1.6 });

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <p className={`display ${styles.brand}`}>{siteConfig.artistName}</p>
        <p className={styles.year}>{new Date().getFullYear()} · DİJİTAL EVREN</p>
      </div>
      <nav className={styles.links} aria-label="Footer">
        <a ref={musicRef} href="#muzik">
          MÜZİK
        </a>
        <Link ref={aboutRef} href="/hakkinda">
          HAKKINDA
        </Link>
        <ExternalLink ref={bubiletRef} href={siteConfig.links.bubilet}>
          BUBİLET ↗
        </ExternalLink>
      </nav>
      <div className={styles.footerBottom}>
        <div className={styles.platformsWrap}>
          <PlatformLinks variant="all" placement="footer" className={styles.platforms} />
          <EntropyBrain id="footer-credit-nearby" />
        </div>
        <div className={styles.creditSlot}>
          <DesignerCredit />
        </div>
      </div>
    </footer>
  );
}
