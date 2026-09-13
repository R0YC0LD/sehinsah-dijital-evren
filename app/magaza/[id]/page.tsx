import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { ProductDetail } from "@/components/store/ProductDetail";
import { products } from "@/data/products";
import { siteConfig } from "@/data/site";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

type Params = { id: string };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} — ${siteConfig.displayName}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const catalog = await getMusicCatalog();

  return (
    <SiteShell catalog={catalog}>
      <main id="main" className="main">
        <ProductDetail product={product} />
      </main>
    </SiteShell>
  );
}
