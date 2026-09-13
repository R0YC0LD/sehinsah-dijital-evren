import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { BiographySection } from "@/components/sections/BiographySection";
import { siteConfig } from "@/data/site";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

export const metadata: Metadata = {
  title: `Şehinşah Kimdir? Ufuk Yıkılmaz Biyografisi — ${siteConfig.displayName}`,
  description:
    "Şehinşah, gerçek adıyla Ufuk Yıkılmaz (HSNSBBH); 27 Aralık 1986 Kemah, Erzincan doğumlu Türk rap sanatçısı ve söz yazarı. Kariyeri, albümleri ve öne çıkan şarkıları.",
};

export default async function AboutPage() {
  const catalog = await getMusicCatalog();

  return (
    <SiteShell catalog={catalog}>
      <main id="main" className="main">
        <BiographySection />
      </main>
    </SiteShell>
  );
}
