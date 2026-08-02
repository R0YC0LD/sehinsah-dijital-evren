"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { ChaosProvider } from "@/components/providers/ChaosProvider";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  useLenis(!reduced, menuOpen);

  return (
    <ChaosProvider>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <div className="site-grain" aria-hidden="true" />
      <Header menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((v) => !v)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ScrollProgress />
      {children}
    </ChaosProvider>
  );
}
