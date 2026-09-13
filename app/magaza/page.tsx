import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { StoreDisclaimer } from "@/components/store/StoreDisclaimer";
import { StoreSection } from "@/components/store/StoreSection";
import { siteConfig } from "@/data/site";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

export const metadata: Metadata = {
  title: `${siteConfig.store.title} — ${siteConfig.displayName}`,
  description: siteConfig.store.subtitle,
};

export default async function StorePage() {
  const catalog = await getMusicCatalog();

  return (
    <SiteShell catalog={catalog}>
      <StoreDisclaimer />
      <main id="main" className="main">
        <StoreSection />
      </main>
    </SiteShell>
  );
}
