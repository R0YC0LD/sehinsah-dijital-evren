import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { siteConfig } from "@/data/site";
import { getReleaseDetail, type ReleaseDetail } from "@/lib/release/detail";
import { formatReleaseDate, releaseTypeLabel } from "@/lib/release/format";
import { findReleaseBySlug, findTrackBySlug, releaseSlug, trackSlug } from "@/lib/release/slug";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";
import type { MusicCatalog, SpotifyRelease } from "@/lib/spotify/types";
import { getSiteUrl } from "@/lib/site-url";

export type ReleasePageData = {
  catalog: MusicCatalog;
  release: SpotifyRelease;
  detail: ReleaseDetail;
  canonicalSlug: string;
  /** Parça sayfasıysa seçili parça. */
  activeTrack: ReleaseDetail["tracks"][number] | null;
  /** Parça sayfası adresleri (yalnızca çok parçalı yayınlarda). */
  trackPaths: Record<string, string>;
  pageUrl: string;
};

export async function loadReleasePageData(slug: string, track?: string): Promise<ReleasePageData> {
  const catalog = await getMusicCatalog();
  const bySlug = findReleaseBySlug(catalog.releases, slug);

  // Eski/kısa bağlantılar: Spotify ID ile gelinirse güzel adrese yönlendir.
  if (!bySlug) {
    const byId = catalog.releases.find((r) => r.id === slug);
    if (byId) permanentRedirect(`/muzik/${releaseSlug(byId, catalog.releases)}`);
    notFound();
  }
  const release = bySlug;
  if (!release.verified) notFound();

  const detail = await getReleaseDetail(release);
  const canonicalSlug = releaseSlug(release, catalog.releases);
  const multi = detail.tracks.length > 1;

  const trackPaths: Record<string, string> = {};
  if (multi) {
    for (const t of detail.tracks) trackPaths[t.id] = `/muzik/${canonicalSlug}/${trackSlug(t, detail.tracks)}`;
  }

  let activeTrack: ReleasePageData["activeTrack"] = null;
  if (track) {
    // Tek parçalı yayında ayrı parça sayfası yoktur; yayın sayfasına yönlendir.
    if (!multi) permanentRedirect(`/muzik/${canonicalSlug}`);
    activeTrack = findTrackBySlug(detail.tracks, track);
    if (!activeTrack) notFound();
  }

  const pageUrl = `${getSiteUrl()}${activeTrack ? trackPaths[activeTrack.id] : `/muzik/${canonicalSlug}`}`;
  return { catalog, release, detail, canonicalSlug, activeTrack, trackPaths, pageUrl };
}

/** Yayın ve parça sayfaları için ortak SEO/OG meta verisi. */
export function releaseMetadata(data: ReleasePageData): Metadata {
  const { release, detail, activeTrack, pageUrl } = data;
  const type = releaseTypeLabel(release);
  const date = formatReleaseDate(release.releaseDate);
  const clip = activeTrack ? Boolean(activeTrack.videoId) : Boolean(detail.videoId);
  const artists = release.artists.map((a) => a.name).join(", ");

  const title = activeTrack
    ? `${activeTrack.name} — ${artists} (${release.name})`
    : `${release.name} — ${siteConfig.displayName}`;
  const description = activeTrack
    ? `${artists} – ${activeTrack.name}. ${release.name} (${type}, ${date}) yayınından. ${clip ? "Klibi izle, " : ""}Spotify’da dinle ve parça bilgilerine bak.`
    : `${siteConfig.displayName} – ${release.name} (${type}, ${date}). ${clip ? "Klibi izle, " : ""}Spotify’da dinle, çıkış tarihi ve parça bilgileri.`;
  const images = release.imageUrl ? [{ url: release.imageUrl, width: 640, height: 640 }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website", locale: "tr_TR", images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: release.imageUrl ? [release.imageUrl] : undefined,
    },
  };
}

export async function releaseMetadataFor(slug: string, track?: string): Promise<Metadata> {
  const catalog = await getMusicCatalog();
  const release = findReleaseBySlug(catalog.releases, slug);
  if (!release) return {};
  try {
    return releaseMetadata(await loadReleasePageData(slug, track));
  } catch {
    // redirect/notFound istisnaları: meta üretilemez, sayfa kendi yönlendirmesini yapar.
    return {};
  }
}
