import { SiteShell } from "@/components/SiteShell";
import { HeroSection } from "@/components/hero/HeroSection";
import { MusicSection } from "@/components/music/MusicSection";
import { TicketSection } from "@/components/sections/TicketSection";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { FinalSection } from "@/components/sections/FinalSection";
import { getMusicCatalog } from "@/lib/spotify/catalog-service";

export default async function HomePage() {
  const catalog = await getMusicCatalog();

  return (
    <SiteShell catalog={catalog}>
      <main id="main" className="main">
        <HeroSection />
        <MusicSection catalog={catalog} />
        <TicketSection />
        <InstagramSection />
        <FinalSection />
      </main>
    </SiteShell>
  );
}
