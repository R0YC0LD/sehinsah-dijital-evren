"use client";

import { useEffect, useRef } from "react";
import { useChaos } from "@/components/providers/ChaosProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { assetPath } from "@/lib/paths/assetPath";
import styles from "./ChaosPhotoReveal.module.css";

type Side = "left" | "right";

const PHOTOS: Array<{ src: string; side: Side; top: string; width: number; window: readonly [number, number] }> = [
  { src: "/media/chaos/sehinsah-1.webp", side: "left", top: "8%", width: 230, window: [0.04, 0.2] },
  { src: "/media/chaos/sehinsah-2.webp", side: "right", top: "24%", width: 170, window: [0.18, 0.34] },
  { src: "/media/chaos/sehinsah-3.webp", side: "left", top: "44%", width: 190, window: [0.36, 0.53] },
  { src: "/media/chaos/sehinsah-4.webp", side: "right", top: "62%", width: 205, window: [0.55, 0.72] },
  { src: "/media/chaos/sehinsah-5.webp", side: "left", top: "80%", width: 250, window: [0.74, 0.95] },
];

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function windowShape(p: number, [start, end]: readonly [number, number]) {
  if (p <= start || p >= end) return 0;
  const local = (p - start) / (end - start);
  const triangle = local < 0.5 ? local * 2 : (1 - local) * 2;
  return smoothstep(Math.min(1, Math.max(0, triangle)));
}

export function ChaosPhotoReveal() {
  const { chaos } = useChaos();
  const reduced = useReducedMotion();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const active = chaos && !reduced;

  useEffect(() => {
    if (!active) return;
    let raf = 0;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      PHOTOS.forEach((cfg, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const shape = windowShape(p, cfg.window);
        const side = cfg.side === "left" ? -1 : 1;
        el.style.opacity = String(shape);
        el.style.transform = `translateX(${side * 120 * (1 - shape)}%)`;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      {PHOTOS.map((p, i) => (
        <div
          key={p.src}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className={`${styles.item} ${p.side === "left" ? styles.left : styles.right}`}
          style={{ top: p.top, ["--w" as string]: `${p.width}px`, opacity: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(p.src)} alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}
