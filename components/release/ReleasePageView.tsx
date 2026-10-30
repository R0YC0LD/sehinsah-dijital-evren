import Link from "next/link";
import { DeepEntropyBrain } from "@/components/easteregg/DeepEntropyBrain";
import { CoverImage } from "@/components/ui/CoverImage";
import { SiteShell } from "@/components/SiteShell";
import { ReleaseExperience, type ExperienceTrack } from "@/components/release/ReleaseExperience";
import styles from "@/components/release/ReleasePage.module.css";
import { siteConfig } from "@/data/site";
import { formatDuration, formatReleaseDate, releaseTypeLabel } from "@/lib/release/format";
import type { ReleasePageData } from "@/lib/release/page-data";
import { releaseSlug } from "@/lib/release/slug";

function isoDuration(ms: number): string | undefined {
  if (!ms) return undefined;
  const total = Math.round(ms / 1000);
  return `PT${Math.floor(total / 60)}M${total % 60}S`;
}

/** /muzik/<yayın> ve /muzik/<yayın>/<parça> sayfalarının ortak içeriği. */
export function ReleasePageView({ data }: { data: ReleasePageData }) {
  const { catalog, release, detail, canonicalSlug, activeTrack, trackPaths, pageUrl } = data;

  const tracks: ExperienceTrack[] = detail.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    durationLabel: formatDuration(t.durationMs),
    explicit: t.explicit,
    videoId: t.videoId,
    spotifyUrl: t.spotifyUrl,
    href: trackPaths[t.id],
  }));
  const totalMs = detail.tracks.reduce((sum, t) => sum + t.durationMs, 0);

  // Komşu yayınlar (iç bağlantı + keşif): bir yeni, üç eski; yoksa tamamlanır.
  const index = catalog.releases.findIndex((r) => r.id === release.id);
  const neighbours = [
    catalog.releases[index - 1],
    catalog.releases[index + 1],
    catalog.releases[index + 2],
    catalog.releases[index + 3],
    catalog.releases[index - 2],
    catalog.releases[index + 4],
  ]
    .filter(Boolean)
    .slice(0, 4);

  const artistRefs = release.artists.map((a) => ({
    "@type": "MusicGroup",
    name: a.name,
    ...(a.id ? { sameAs: `https://open.spotify.com/artist/${a.id}` } : {}),
  }));
  const videoId = activeTrack ? activeTrack.videoId : detail.videoId;
  const videoLd = videoId
    ? {
        video: {
          "@type": "VideoObject",
          name: `${activeTrack?.name ?? release.name} — ${siteConfig.displayName}`,
          description: `${siteConfig.displayName} – ${activeTrack?.name ?? release.name} klibi.`,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          uploadDate: release.releaseDate,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        },
      }
    : {};

  const jsonLd = activeTrack
    ? {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        name: activeTrack.name,
        url: pageUrl,
        datePublished: release.releaseDate,
        duration: isoDuration(activeTrack.durationMs),
        ...(release.imageUrl ? { image: release.imageUrl } : {}),
        byArtist: activeTrack.artists.length
          ? activeTrack.artists.map((a) => ({
              "@type": "MusicGroup",
              name: a.name,
              ...(a.id ? { sameAs: `https://open.spotify.com/artist/${a.id}` } : {}),
            }))
          : artistRefs,
        inAlbum: { "@type": "MusicAlbum", name: release.name, url: `${pageUrl.split("/muzik/")[0]}/muzik/${canonicalSlug}` },
        sameAs: [activeTrack.spotifyUrl],
        ...videoLd,
      }
    : {
        "@context": "https://schema.org",
        "@type": detail.tracks.length > 1 ? "MusicAlbum" : "MusicRecording",
        name: release.name,
        url: pageUrl,
        datePublished: release.releaseDate,
        ...(release.imageUrl ? { image: release.imageUrl } : {}),
        byArtist: artistRefs,
        sameAs: [release.spotifyUrl],
        ...(detail.tracks.length === 1 ? { duration: isoDuration(detail.tracks[0].durationMs) } : {}),
        ...(detail.tracks.length > 1
          ? {
              numTracks: detail.tracks.length,
              track: detail.tracks.map((t) => ({
                "@type": "MusicRecording",
                name: t.name,
                url: t.spotifyUrl,
              })),
            }
          : {}),
        ...videoLd,
      };

  return (
    <SiteShell catalog={catalog}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main id="main" className="main">
        <section className={`section-shell ${styles.section}`} aria-label={activeTrack?.name ?? release.name}>
          <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
            <span className={`display ${styles.ghost}`}>{release.releaseYear}</span>
          </div>

          <div className={`section-content content-wide ${styles.content}`}>
            <div className={styles.crumbs}>
              <Link href="/#muzik" className={`editorial-link ${styles.back}`}>
                ← MÜZİĞE DÖN
              </Link>
              {activeTrack ? (
                <Link href={`/muzik/${canonicalSlug}`} className={`editorial-link ${styles.back}`}>
                  {release.name.toLocaleUpperCase("tr")} · TÜM PARÇALAR
                </Link>
              ) : null}
            </div>

            <ReleaseExperience
              release={{
                id: release.id,
                name: release.name,
                coverUrl: release.imageUrl,
                typeLabel: releaseTypeLabel(release),
                dateLabel: formatReleaseDate(release.releaseDate),
                spotifyUrl: release.spotifyUrl,
              }}
              artists={release.artists}
              tracks={tracks}
              initialTrackId={activeTrack?.id ?? null}
              releaseVideoId={detail.videoId}
              totalDurationLabel={formatDuration(totalMs)}
              label={detail.label}
              copyrights={detail.copyrights}
            />

            {neighbours.length ? (
              <div className={styles.related}>
                <DeepEntropyBrain releaseId={release.id} placement="related" />
                <h2 className={`display ${styles.relatedTitle}`}>DİĞER YAYINLAR</h2>
                <div className={styles.relatedGrid}>
                  {neighbours.map((r) => (
                    <Link
                      key={r.id}
                      href={`/muzik/${releaseSlug(r, catalog.releases)}`}
                      className={styles.card}
                    >
                      <div className={styles.cover}>
                        <CoverImage src={r.imageUrl} alt={`${r.name} albüm kapağı`} size="md" sizes="(max-width: 699px) 45vw, 200px" />
                      </div>
                      <p className={styles.cardName}>{r.name}</p>
                      <p className={styles.cardMeta}>
                        {r.releaseYear} · {releaseTypeLabel(r).toLocaleUpperCase("tr")}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
