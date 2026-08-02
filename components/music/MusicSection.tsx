import { AlbumGrid } from "@/components/music/AlbumGrid";
import { CatalogSummary } from "@/components/music/CatalogSummary";
import { FeaturedTrackList } from "@/components/music/FeaturedTrackList";
import { LatestRelease } from "@/components/music/LatestRelease";
import { SpotifyArtistEmbed } from "@/components/music/SpotifyArtistEmbed";
import { PlatformLinks } from "@/components/platforms/PlatformLinks";
import { siteConfig } from "@/data/site";
import type { MusicCatalog } from "@/lib/spotify/types";
import styles from "./MusicSection.module.css";

type Props = {
  catalog: MusicCatalog;
};

export function MusicSection({ catalog }: Props) {
  const latest =
    catalog.latestRelease?.verified === true ? catalog.latestRelease : null;

  return (
    <section id="muzik" className={`section-shell ${styles.section}`} aria-label="Müzik">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={styles.bigNum}>02</span>
        <span className={styles.axis} />
      </div>

      <div className={`section-content content-medium ${styles.content}`}>
        <div className={styles.header}>
          <div>
            <p className="meta-label">02 / MÜZİK</p>
            <h2 className={`display ${styles.title}`}>{siteConfig.music.title}</h2>
            <p className={styles.subtitle}>{siteConfig.music.subtitle}</p>
            <div className={styles.listenRow}>
              <span className={styles.listenLabel}>DİNLE</span>
              <PlatformLinks variant="listen" placement="music" />
            </div>
          </div>
          <CatalogSummary catalog={catalog} />
        </div>

        <div className={styles.topGrid}>
          <LatestRelease release={latest} />
          <FeaturedTrackList catalog={catalog} />
        </div>

        <div className={styles.embed}>
          <SpotifyArtistEmbed />
        </div>

        <div className={styles.disco}>
          <h3 className={`display ${styles.discoTitle}`}>
            {siteConfig.music.discographyTitle}
          </h3>
          <AlbumGrid catalog={catalog} />
        </div>
      </div>
    </section>
  );
}
