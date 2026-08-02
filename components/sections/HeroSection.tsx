"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FeatherField } from "@/components/effects/FeatherField";
import { siteConfig } from "@/data/site";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./HeroSection.module.css";

type Props = {
  ready: boolean;
};

export function HeroSection({ ready }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const [imgOk, setImgOk] = useState(true);
  const letters = siteConfig.artistName.split("");

  useLayoutEffect(() => {
    if (!ready || !rootRef.current || reduced) return;

    let removeParallax: (() => void) | undefined;

    const ctx = gsap.context(() => {
      const back = rootRef.current!.querySelectorAll("[data-title-back] span");
      const front = rootRef.current!.querySelectorAll("[data-title-front] span");
      const figure = rootRef.current!.querySelector("[data-hero-figure]");
      const copy = rootRef.current!.querySelectorAll("[data-hero-copy]");
      const cue = rootRef.current!.querySelector("[data-scroll-cue]");
      const feathers = rootRef.current!.querySelector("[data-hero-feathers]");

      gsap.set([back, front], { opacity: 0, y: 60 });
      gsap.set(figure, { opacity: 0, filter: "blur(14px)", scale: 1.06 });
      gsap.set(copy, { opacity: 0, y: 24 });
      gsap.set(cue, { opacity: 0 });
      gsap.set(feathers, { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.to([back, front], {
        opacity: 1,
        y: 0,
        stagger: { each: 0.05, from: "random" },
        duration: 0.85,
        ease: "power3.out",
      });
      tl.to(
        figure,
        {
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
        },
        "-=0.45",
      );
      tl.to(feathers, { opacity: 1, duration: 0.6 }, "-=0.4");
      tl.to(
        copy,
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.65, ease: "power3.out" },
        "-=0.35",
      );
      tl.to(cue, { opacity: 1, duration: 0.5 }, "-=0.1");

      if (!isTouch) {
        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to("[data-title-back], [data-title-front]", {
            x: nx * 4,
            y: ny * 3,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto",
          });
          gsap.to(figure, {
            x: nx * 10,
            y: ny * 8,
            duration: 0.7,
            ease: "power2.out",
            overwrite: "auto",
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        removeParallax = () => window.removeEventListener("pointermove", onMove);
      }
    }, rootRef);

    return () => {
      removeParallax?.();
      ctx.revert();
    };
  }, [ready, reduced, isTouch]);

  return (
    <section
      ref={rootRef}
      id="bosluk"
      className={styles.hero}
      data-section="bosluk"
      aria-label="Boşluk"
    >
      <div className={styles.titleBack} data-title-back aria-hidden="true">
        {letters.map((l, i) => (
          <span key={`b-${i}`}>{l}</span>
        ))}
      </div>

      <div className={styles.figureWrap} data-hero-figure>
        {imgOk ? (
          <Image
            src={siteConfig.media.falling}
            alt="Şehinşah — şeffaf arka planlı düşüş görseli"
            width={1000}
            height={1000}
            priority
            className={styles.figure}
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className={styles.fallback} role="img" aria-label="Görsel yüklenemedi">
            GÖRSEL YOK
          </div>
        )}
        <div data-hero-feathers>
          <FeatherField count={isTouch ? 4 : 10} />
        </div>
      </div>

      <div className={styles.titleFront} data-title-front aria-hidden="true">
        {letters.map((l, i) => (
          <span key={`f-${i}`} className={i % 3 === 1 ? styles.frontOn : styles.frontOff}>
            {l}
          </span>
        ))}
      </div>

      <h1 className="sr-only">{siteConfig.artistName}</h1>

      <div className={styles.copy} data-hero-copy>
        <p>{siteConfig.hero.lineOne}</p>
        <p>{siteConfig.hero.lineTwo}</p>
      </div>

      <a href="#dusus" className={styles.cue} data-scroll-cue data-cursor="AÇ">
        <span>{siteConfig.hero.scrollCue}</span>
        <span className={styles.cueLine} aria-hidden="true">
          <span className={styles.cueDot} />
        </span>
      </a>
    </section>
  );
}
