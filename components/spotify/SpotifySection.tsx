import { SpotifyArtistEmbed } from "@/components/spotify/SpotifyArtistEmbed";
import { SpotifyAlbumGrid } from "@/components/spotify/SpotifyAlbumGrid";
import { SpotifyAttribution } from "@/components/spotify/SpotifyAttribution";
import { SpotifyFallback } from "@/components/spotify/SpotifyFallback";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/site";
import type { SpotifyCatalog } from "@/lib/spotify/types";
import styles from "./SpotifySection.module.css";

type Props = {
  catalog: SpotifyCatalog;
};

export function SpotifySection({ catalog }: Props) {
  const hasAlbums = catalog.albums.length + catalog.singles.length > 0;

  return (
    <section id="muzik" className={styles.section} aria-label="Müzik">
      <SectionHeading
        title={siteConfig.music.title}
        action={
          <ExternalLink
            href={siteConfig.spotify.artistUrl}
            className={styles.listen}
            aria-label="Spotify’da dinle (yeni sekme)"
          >
            Spotify’da dinle ↗
          </ExternalLink>
        }
      />

      <div className={styles.popular}>
        <SpotifyArtistEmbed />
      </div>

      <div className={styles.disco}>
        <h3 className={`display ${styles.discoTitle}`}>
          {siteConfig.music.discographyTitle}
        </h3>
        {hasAlbums ? (
          <SpotifyAlbumGrid albums={catalog.albums} singles={catalog.singles} />
        ) : (
          <SpotifyFallback />
        )}
      </div>

      <SpotifyAttribution />
    </section>
  );
}
