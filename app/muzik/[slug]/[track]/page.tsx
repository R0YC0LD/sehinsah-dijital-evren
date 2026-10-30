import type { Metadata } from "next";
import { ReleasePageView } from "@/components/release/ReleasePageView";
import { storedTracks } from "@/lib/release/detail";
import { loadReleasePageData, releaseMetadataFor } from "@/lib/release/page-data";
import { releaseSlug, trackSlug } from "@/lib/release/slug";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

type Params = { slug: string; track: string };

export const revalidate = 21600;

/** Çok parçalı yayınların (albüm/EP) her parçası kendi sayfasına sahiptir: /muzik/<yayın>/<parça>. */
export async function generateStaticParams() {
  const catalog = await getMusicCatalog();
  return catalog.releases.flatMap((r) => {
    const tracks = storedTracks(r.id);
    if (tracks.length < 2) return [];
    return tracks.map((t) => ({ slug: releaseSlug(r, catalog.releases), track: trackSlug(t, tracks) }));
  });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, track } = await params;
  return releaseMetadataFor(slug, track);
}

export default async function TrackPage({ params }: { params: Promise<Params> }) {
  const { slug, track } = await params;
  return <ReleasePageView data={await loadReleasePageData(slug, track)} />;
}
