import type { Metadata } from "next";
import { ReleasePageView } from "@/components/release/ReleasePageView";
import { loadReleasePageData, releaseMetadataFor } from "@/lib/release/page-data";
import { releaseSlug } from "@/lib/release/slug";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

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

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return releaseMetadataFor(slug);
}

export default async function ReleasePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <ReleasePageView data={await loadReleasePageData(slug)} />;
}
