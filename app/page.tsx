import { HeroSection } from "@/components/hero/HeroSection";
import { SpotifySection } from "@/components/spotify/SpotifySection";
import { TicketSection } from "@/components/sections/TicketSection";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { FinalSection } from "@/components/sections/FinalSection";
import { getSpotifyCatalog } from "@/lib/spotify/artist";

export default async function HomePage() {
  const catalog = await getSpotifyCatalog();

  return (
    <main id="main" className="main">
      <HeroSection />
      <SpotifySection catalog={catalog} />
      <TicketSection />
      <InstagramSection />
      <FinalSection />
    </main>
  );
}
