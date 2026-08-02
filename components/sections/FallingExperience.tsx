"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FeatherField } from "@/components/effects/FeatherField";
import { siteConfig } from "@/data/site";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./FallingExperience.module.css";

gsap.registerPlugin(ScrollTrigger);

export function FallingExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const [imgOk, setImgOk] = useState(true);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const character = section.querySelector(".falling-character");
      const stage = section.querySelector("[data-fall-stage]");
      const layers = section.querySelectorAll("[data-fall-layer]");
      const fragments = section.querySelectorAll("[data-fragment]");
      const titleBack = section.querySelector("[data-fall-title-back]");
      const titleFront = section.querySelector("[data-fall-title-front]");

      if (!character || !stage) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 900px)",
          mobile: "(max-width: 899px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, mobile, reduceMotion } =
            context.conditions as Record<string, boolean>;

          if (reduceMotion || reduced) {
            gsap.set(character, {
              x: "8vw",
              y: "10vh",
              rotation: -2,
              scale: 0.95,
              opacity: 1,
            });
            return;
          }

          const endDistance = desktop ? "+=400%" : "+=300%";
          const keyframes = desktop
            ? [
                { x: "16vw", y: "-12vh", rotation: -4, scale: 1.02, opacity: 1 },
                { x: "7vw", y: "8vh", rotation: 3, scale: 1.04 },
                { x: "-8vw", y: "31vh", rotation: -7, scale: 0.98 },
                { x: "5vw", y: "57vh", rotation: 5, scale: 0.93 },
                { x: "-5vw", y: "84vh", rotation: -4, scale: 0.88 },
                {
                  x: "2vw",
                  y: "118vh",
                  rotation: 2,
                  scale: 0.8,
                  opacity: 0.15,
                },
              ]
            : [
                { x: "4vw", y: "-8vh", rotation: -3, scale: 1, opacity: 1 },
                { x: "-2vw", y: "12vh", rotation: 2, scale: 1.02 },
                { x: "3vw", y: "34vh", rotation: -4, scale: 0.96 },
                { x: "-3vw", y: "58vh", rotation: 3, scale: 0.9 },
                { x: "1vw", y: "86vh", rotation: -2, scale: 0.84 },
                {
                  x: "0vw",
                  y: "110vh",
                  rotation: 1,
                  scale: 0.78,
                  opacity: 0.2,
                },
              ];

          gsap.set(character, keyframes[0]);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: endDistance,
              scrub: desktop ? 0.9 : 0.75,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          keyframes.slice(1).forEach((frame, i) => {
            tl.to(character, { ...frame, ease: "none" }, i);
          });

          tl.to(
            titleBack,
            { y: "-18vh", opacity: 0.15, ease: "none" },
            0,
          );
          tl.to(
            titleFront,
            { y: "12vh", opacity: 0.35, ease: "none" },
            0,
          );

          tl.to(
            layers[0],
            { opacity: 1, ease: "none" },
            0,
          );
          tl.to(layers[0], { opacity: 0, ease: "none" }, 1.1);
          tl.fromTo(
            layers[1],
            { opacity: 0 },
            { opacity: 1, ease: "none" },
            1,
          );
          tl.to(layers[1], { opacity: 0, ease: "none" }, 2.2);
          tl.fromTo(
            layers[2],
            { opacity: 0 },
            { opacity: 1, ease: "none" },
            2,
          );
          tl.to(layers[2], { opacity: 0, ease: "none" }, 3.4);
          tl.fromTo(
            layers[3],
            { opacity: 0 },
            { opacity: 1, ease: "none" },
            3.2,
          );
          tl.to(layers[3], { opacity: 0, ease: "none" }, 4.3);
          tl.fromTo(
            layers[4],
            { opacity: 0 },
            { opacity: 1, ease: "none" },
            4.1,
          );

          fragments.forEach((el, i) => {
            tl.fromTo(
              el,
              {
                xPercent: i % 2 === 0 ? -40 : 40,
                opacity: 0,
              },
              {
                xPercent: i % 2 === 0 ? 30 : -30,
                opacity: 0.7,
                ease: "none",
              },
              0.8 + i * 0.35,
            );
          });

          if (mobile) {
            /* mobile path already uses shorter pin */
          }
        },
      );

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      return () => {
        window.removeEventListener("load", onLoad);
        mm.revert();
      };
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="dusus"
      className={styles.section}
      data-section="dusus"
      aria-label="Düşüş"
    >
      <div className={styles.stage} data-fall-stage>
        <div className={`${styles.layer} ${styles.void}`} data-fall-layer />
        <div className={`${styles.layer} ${styles.lines}`} data-fall-layer />
        <div className={`${styles.layer} ${styles.paper}`} data-fall-layer />
        <div className={`${styles.layer} ${styles.blood}`} data-fall-layer />
        <div className={`${styles.layer} ${styles.voidEnd}`} data-fall-layer />

        <p className={`display ${styles.titleBack}`} data-fall-title-back aria-hidden="true">
          DÜŞÜŞ
        </p>

        <div className={styles.characterWrap}>
          {imgOk ? (
            <Image
              src={siteConfig.media.falling}
              alt=""
              width={1000}
              height={1000}
              className={`falling-character ${styles.character}`}
              onError={() => setImgOk(false)}
              sizes="(max-width: 899px) 78vw, 42vw"
            />
          ) : (
            <div
              className={`falling-character ${styles.fallback}`}
              aria-hidden="true"
            />
          )}
          <FeatherField count={isTouch ? 5 : 12} />
        </div>

        <p className={`display ${styles.titleFront}`} data-fall-title-front aria-hidden="true">
          DÜŞÜŞ
        </p>

        <div className={styles.copy}>
          <h2 className="display">{siteConfig.falling.lineOne}</h2>
          <p>{siteConfig.falling.lineTwo}</p>
        </div>

        <div className={styles.fragments} aria-hidden="true">
          {siteConfig.falling.fragments.map((word) => (
            <span key={word} data-fragment className={styles.fragment}>
              {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
