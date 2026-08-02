"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IntroLoader } from "@/components/loading/IntroLoader";
import { Header } from "@/components/layout/Header";
import { MenuOverlay } from "@/components/layout/MenuOverlay";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { ControlDock } from "@/components/layout/ControlDock";
import { NoiseOverlay } from "@/components/effects/NoiseOverlay";
import { SectionIndex } from "@/components/ui/SectionIndex";
import { HeroSection } from "@/components/sections/HeroSection";
import { FallingExperience } from "@/components/sections/FallingExperience";
import { WordStormSection } from "@/components/sections/WordStormSection";
import { TicketSection } from "@/components/sections/TicketSection";
import { ArchiveSection } from "@/components/sections/ArchiveSection";
import { InstagramPortal } from "@/components/sections/InstagramPortal";
import { FinalSection } from "@/components/sections/FinalSection";
import { sections, type SectionId } from "@/data/site";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceShell() {
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<SectionId>(sections[0].id);
  const lenisRef = useLenis({ enabled: !reduced, stopped: menuOpen });

  useEffect(() => {
    document.body.classList.toggle("is-touch", isTouch);
    document.body.classList.toggle("reduce-motion", reduced);
  }, [isTouch, reduced]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(p);
      setScrolled(window.scrollY > 40);

      let current: SectionId = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) {
          current = section.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(t);
  }, [ready]);

  const activeMeta = useMemo(
    () => sections.find((s) => s.id === activeId) ?? sections[0],
    [activeId],
  );

  const indexLabel = `${activeMeta.index}/07`;

  const navigateTo = useCallback(
    (href: string) => {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return;

      if (lenisRef.current && !reduced) {
        lenisRef.current.scrollTo(el, { offset: 0, duration: 1.2 });
      } else {
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    },
    [lenisRef, reduced],
  );

  const backToTop = useCallback(() => {
    if (lenisRef.current && !reduced) {
      lenisRef.current.scrollTo(0, { duration: 1.1 });
    } else {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }, [lenisRef, reduced]);

  return (
    <div className="site-root" data-chaos="false">
      <IntroLoader onComplete={() => setReady(true)} />
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>

      <Header
        scrolled={scrolled}
        activeId={activeId}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((v) => !v)}
      />
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateTo}
      />
      <ScrollProgress progress={progress} indexLabel={indexLabel} />
      <SectionIndex activeId={activeId} />
      <ControlDock indexLabel={indexLabel} reducedMotion={reduced} />
      <CustomCursor />
      <NoiseOverlay />

      <main id="main" className="main">
        <HeroSection ready={ready} />
        <FallingExperience />
        <WordStormSection />
        <TicketSection />
        <ArchiveSection />
        <InstagramPortal />
        <FinalSection onBackTop={backToTop} />
      </main>
    </div>
  );
}
