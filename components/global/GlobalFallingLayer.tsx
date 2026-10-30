"use client";

import { useEffect, useRef } from "react";
import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import { useCharacterAudioPulse } from "@/hooks/useCharacterAudioPulse";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./GlobalFallingLayer.module.css";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Konum takip süresi (sn): küçük = daha seri, büyük = daha ağır/yumuşak. */
const FOLLOW_TAU = 0.11;
/** Eğim/gölge tepkisi için hız yumuşatma süresi (sn). */
const SWAY_TAU = 0.2;
const BASE_ROTATION = -3;

/**
 * Sayfa kaydıkça yukarıdan aşağıya düşen karakter. Yol ve yön eskisiyle aynı
 * (üstte -%64 ekran → altta +%124 ekran, sabit x ekseni); değişen şey hareket motoru:
 *
 *  - GSAP scrub + ScrollTrigger + Lenis'in üst üste binen yumuşatması yerine tek bir rAF döngüsü,
 *    kare süresine (dt) bağlı sönümlü takip → hız/ekran yenileme hızından bağımsız akıcılık.
 *  - Yalnızca `transform`/`opacity` yazılır (compositor'da kalır): scroll hızına göre değişen
 *    blur/mask/CSS değişkeni yok, bu yüzden kare başına yeniden boyama olmaz.
 *  - Sayfa yüksekliği değişince (görseller yüklenirken) ilerleme "zıplamaz": takip eden yumuşatma
 *    kaymayı sönümler.
 *  - Hareket yokken döngü durur (pil/CPU), kaydırma/boyut değişimi uyandırır.
 */
export function GlobalFallingLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const audioReactiveRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const src = assetPath(siteConfig.media.falling);

  useCharacterAudioPulse(audioReactiveRef);

  useEffect(() => {
    const character = characterRef.current;
    const shadow = shadowRef.current;
    if (reduced || !character || !shadow) return;

    const isMobile = () => window.matchMedia("(max-width: 899px)").matches;
    let viewport = window.innerHeight;
    let maxScroll = 1;
    let smooth = 0;
    let sway = 0;
    let raf = 0;
    let last = 0;

    const measure = () => {
      viewport = window.innerHeight;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
    };
    const readTarget = () => clamp(window.scrollY / maxScroll, 0, 1);

    const apply = () => {
      const y = lerp(-0.64 * viewport, 1.24 * viewport, smooth);
      const rotation = BASE_ROTATION - sway * 1.5;
      const scale = lerp(1, 0.95, smooth);
      character.style.transform = `translate3d(-50%, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(4)})`;

      // Hızla büyüyen yumuşak gölge: yalnızca konum/ölçek/opaklık (blur sabit).
      const speed = Math.abs(sway);
      const rest = isMobile() ? 0.018 : 0.028;
      const peak = isMobile() ? 0.048 : 0.066;
      const offset = sway >= 0 ? -6 - sway * (isMobile() ? 10 : 16) : -6 - sway * (isMobile() ? 8 : 12);
      shadow.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale3d(1, ${(1.01 + speed * 0.02).toFixed(4)}, 1)`;
      shadow.style.opacity = lerp(rest, peak, speed).toFixed(4);
    };

    const frame = (now: number) => {
      const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.05);
      last = now;

      const target = readTarget();
      const previous = smooth;
      smooth += (target - smooth) * (1 - Math.exp(-dt / FOLLOW_TAU));

      // Ekran/sn cinsinden kaydırma hızı → eğim ve gölge (kısıtlı, yumuşatılmış).
      const screensPerSecond = ((smooth - previous) / dt) * (maxScroll / viewport);
      const swayTarget = clamp(screensPerSecond * 0.45, -1, 1);
      sway += (swayTarget - sway) * (1 - Math.exp(-dt / SWAY_TAU));

      apply();

      const moving = Math.abs(target - smooth) > 0.00004 || Math.abs(sway) > 0.003;
      raf = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) {
        sway = 0;
        apply();
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      measure();
      wake();
    };

    measure();
    smooth = readTarget(); // sayfa ortasında açılırsa tepeden "düşerek" başlamasın
    apply();

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    window.addEventListener("sehinsah:loading-complete", onResize);
    // Görseller yüklenip sayfa uzadıkça ilerleme yeniden hesaplanır (yumuşatma kaymayı sönümler).
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    observer?.observe(document.body);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      window.removeEventListener("sehinsah:loading-complete", onResize);
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className={styles.layer} aria-hidden="true">
      <div ref={characterRef} className={styles.character}>
        <div ref={audioReactiveRef} className={styles.audioReactive} data-audio-reactive>
          <span
            ref={shadowRef}
            className={styles.shadow}
            data-fall-shadow
            style={{ "--fall-mask": `url("${src}")` } as React.CSSProperties}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.image}
            src={src}
            alt=""
            width={1000}
            height={1000}
            draggable={false}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
