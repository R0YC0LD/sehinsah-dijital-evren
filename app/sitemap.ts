import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { releaseSlug } from "@/lib/release/slug";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const catalog = await getMusicCatalog();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/hakkinda`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/magaza`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...catalog.releases.map((r) => ({
      url: `${siteUrl}/muzik/${releaseSlug(r, catalog.releases)}`,
      lastModified: r.releaseDate ? new Date(r.releaseDate) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/magaza/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
