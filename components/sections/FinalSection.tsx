"use client";

import { useLayoutEffect, useRef } from "react";
import { Footer } from "@/components/layout/Footer";
import { registerGsap } from "@/lib/gsap/register";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./FinalSection.module.css";

export function FinalSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;
    const { gsap } = registerGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-final-line]",
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 75%",
            once: true,
          },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="final" ref={ref} className={`section-shell ${styles.section}`} aria-label="Final">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true" />
      <div className={`section-content ${styles.stage}`}>
        <div className={styles.mask}>
          <h2 className={`display ${styles.line}`} data-final-line>
            {siteConfig.final.lineOne}
          </h2>
        </div>
        <p className={styles.sub}>{siteConfig.final.lineTwo}</p>
        <a href="#hero" className={`editorial-link ${styles.back}`}>
          {siteConfig.final.backToTop}
        </a>
      </div>
      <div className="section-content">
        <Footer />
      </div>
    </section>
  );
}
