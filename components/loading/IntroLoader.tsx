"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./IntroLoader.module.css";

const STORAGE_KEY = "sehinsah-intro-done";

type Props = {
  onComplete: () => void;
};

export function IntroLoader({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(true);
  const letters = siteConfig.artistName.split("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false);
        onComplete();
        return;
      }
    } catch {
      /* ignore */
    }

    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const letterEls = root.querySelectorAll("[data-loader-letter]");
      const wave = root.querySelector("[data-wave]");
      const top = root.querySelector("[data-curtain-top]");
      const bottom = root.querySelector("[data-curtain-bottom]");

      if (reduced) {
        const obj = { p: 0 };
        gsap.to(obj, {
          p: 100,
          duration: 0.4,
          ease: "none",
          onUpdate: () => setPercent(Math.round(obj.p)),
          onComplete: () => {
            try {
              sessionStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
            onComplete();
          },
        });
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
          onComplete();
        },
      });

      const counter = { p: 0 };
      tl.fromTo(
        letterEls,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.45,
          ease: "power3.out",
        },
        0,
      );

      tl.to(
        counter,
        {
          p: 100,
          duration: 1.8,
          ease: "power1.inOut",
          onUpdate: () => setPercent(Math.round(counter.p)),
        },
        0.15,
      );

      if (wave) {
        tl.fromTo(
          wave,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.8, ease: "power1.inOut" },
          0.15,
        );
      }

      tl.to(
        letterEls,
        {
          x: (i) => (i - letters.length / 2) * 28,
          opacity: 0,
          duration: 0.55,
          ease: "power4.in",
        },
        "+=0.1",
      );

      tl.to(
        [top, bottom],
        {
          yPercent: (i) => (i === 0 ? -100 : 100),
          duration: 1,
          ease: "power4.inOut",
          stagger: 0.05,
        },
        "-=0.2",
      );
    }, root);

    return () => ctx.revert();
  }, [onComplete, reduced, letters.length]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-label="Yükleniyor"
    >
      <div className={styles.curtainTop} data-curtain-top />
      <div className={styles.curtainBottom} data-curtain-bottom />
      <div className={styles.center}>
        <p className={`display ${styles.title}`} aria-hidden="true">
          {letters.map((letter, i) => (
            <span key={`${letter}-${i}`} data-loader-letter>
              {letter}
            </span>
          ))}
        </p>
        <div className={styles.waveTrack}>
          <span className={styles.wave} data-wave />
        </div>
      </div>
      <div className={styles.percent} aria-hidden="true">
        {String(percent).padStart(2, "0")}
      </div>
      <span className="sr-only">%{percent} yüklendi</span>
    </div>
  );
}
