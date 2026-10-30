import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import {
  ReleaseExperience,
  type ExperienceTrack,
} from "@/components/release/ReleaseExperience";
import styles from "@/components/release/ReleasePage.module.css";
import { siteConfig } from "@/data/site";
import { getReleaseDetail } from "@/lib/release/detail";
import { formatDuration, formatReleaseDate, releaseTypeLabel } from "@/lib/release/format";
import { findReleaseBySlug, releaseSlug } from "@/lib/release/slug";
import { findVideoId } from "@/lib/youtube/match";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";
import { getSiteUrl } from "@/lib/site-url";

type Params = { slug: string };

export const revalidate = 21600;

/**
 * Albüm detayları data/generated/release-details.json'dan okunduğu için tüm sayfalar build'de
 * statik üretilir (Spotify'a istek gitmez). Sonradan eklenen sürümler ilk ziyarette üretilir.
 */
export async function generateStaticParams() {
  const catalog = await getMusicCatalog();
  return catalog.releases.map((r) => ({ slug: releaseSlug(r, catalog.releases) }));
}

async function resolve(slug: string) {
  const catalog = await getMusicCatalog();
  const release = findReleaseBySlug(catalog.releases, slug);
  return { catalog, release };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { catalog, release } = await resolve(slug);
  if (!release) return {};

  const canonicalSlug = releaseSlug(release, catalog.releases);
  const type = releaseTypeLabel(release);
  const title = `${release.name} — ${siteConfig.displayName}`;
  const hasClip = Boolean(findVideoId(release.name, [release.id]));
  const description = `${siteConfig.displayName} – ${release.name} (${type}, ${formatReleaseDate(release.releaseDate)}). ${hasClip ? "Klibi izle, " : ""}Spotify’da dinle, çıkış tarihi ve parça bilgileri.`;
  const images = release.imageUrl ? [{ url: release.imageUrl, width: 640, height: 640 }] : undefined;
  const url = `${getSiteUrl()}/muzik/${canonicalSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "tr_TR", images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: release.imageUrl ? [release.imageUrl] : undefined,
    },
  };
}

function isoDuration(ms: number): string | undefined {
  if (!ms) return undefined;
  const total = Math.round(ms / 1000);
  return `PT${Math.floor(total / 60)}M${total % 60}S`;
}

export default async function ReleasePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { catalog, release: bySlug } = await resolve(slug);

  // Eski/kısa bağlantılar: Spotify ID ile gelinirse güzel adrese yönlendir.
  const byId = bySlug ? null : catalog.releases.find((r) => r.id === slug);
  if (byId) permanentRedirect(`/muzik/${releaseSlug(byId, catalog.releases)}`);

  const release = bySlug;
  if (!release || !release.verified) notFound();

  const detail = await getReleaseDetail(release);
  const siteUrl = getSiteUrl();
  const canonicalSlug = releaseSlug(release, catalog.releases);
  const pageUrl = `${siteUrl}/muzik/${canonicalSlug}`;

  const tracks: ExperienceTrack[] = detail.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    durationLabel: formatDuration(t.durationMs),
    explicit: t.explicit,
    videoId: t.videoId,
    spotifyUrl: t.spotifyUrl,
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

  const dateLabel = formatReleaseDate(release.releaseDate);
  const artistRefs = release.artists.map((a) => ({
    "@type": "MusicGroup",
    name: a.name,
    ...(a.id ? { sameAs: `https://open.spotify.com/artist/${a.id}` } : {}),
  }));
  const jsonLd = {
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
    ...(detail.videoId
      ? {
          video: {
            "@type": "VideoObject",
            name: `${release.name} — ${siteConfig.displayName}`,
            description: `${siteConfig.displayName} – ${release.name} klibi.`,
            thumbnailUrl: `https://i.ytimg.com/vi/${detail.videoId}/hqdefault.jpg`,
            uploadDate: release.releaseDate,
            embedUrl: `https://www.youtube.com/embed/${detail.videoId}`,
          },
        }
      : {}),
  };

  return (
    <SiteShell catalog={catalog}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main id="main" className="main">
        <section className={`section-shell ${styles.section}`} aria-label={release.name}>
          <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
            <span className={`display ${styles.ghost}`}>{release.releaseYear}</span>
          </div>

          <div className={`section-content content-wide ${styles.content}`}>
            <Link href="/#muzik" className={`editorial-link ${styles.back}`}>
              ← MÜZİĞE DÖN
            </Link>

            <ReleaseExperience
              release={{
                id: release.id,
                name: release.name,
                coverUrl: release.imageUrl,
                typeLabel: releaseTypeLabel(release),
                dateLabel,
                spotifyUrl: release.spotifyUrl,
              }}
              artists={release.artists}
              tracks={tracks}
              releaseVideoId={detail.videoId}
              totalDurationLabel={formatDuration(totalMs)}
              label={detail.label}
              copyrights={detail.copyrights}
            />

            {neighbours.length ? (
              <div className={styles.related}>
                <h2 className={`display ${styles.relatedTitle}`}>DİĞER YAYINLAR</h2>
                <div className={styles.relatedGrid}>
                  {neighbours.map((r) => (
                    <Link
                      key={r.id}
                      href={`/muzik/${releaseSlug(r, catalog.releases)}`}
                      className={styles.card}
                    >
                      <div className={styles.cover}>
                        {r.imageUrl ? (
                          <Image
                            src={r.imageUrl}
                            alt={`${r.name} albüm kapağı`}
                            fill
                            sizes="(max-width: 699px) 45vw, 200px"
                            loading="lazy"
                          />
                        ) : null}
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
