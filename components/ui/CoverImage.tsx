"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./CoverImage.module.css";

type Size = "sm" | "md" | "lg";

/** Spotify kapak adresindeki boyut kodu: b273 = 640px, 1e02 = 300px, 4851 = 64px. */
const CODE: Record<Size, string> = { lg: "b273", md: "1e02", sm: "4851" };
const PATTERN = /^https:\/\/i\.scdn\.co\/image\/ab67616d0000(?:b273|1e02|4851)(.+)$/;
const STATIC_EXPORT = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "github-pages";

/**
 * Kapak adresini istenen boyuta çevirir (Spotify kapak biçimi değilse olduğu gibi döner).
 * Spotify CDN'i önbellekte olmayan kapakta saniyelerce bekletebildiği için aynı dosyalar
 * public/media/covers altından sunulur (scripts/mirror-covers.mjs). Henüz inmemiş yeni kapak
 * next.config'deki fallback rewrite ile Spotify'dan gelir.
 */
export function coverUrl(src: string, size: Size): string {
  const m = PATTERN.exec(src);
  if (!m) return src;
  const id = `ab67616d0000${CODE[size]}${m[1]}`;
  return STATIC_EXPORT ? `https://i.scdn.co/image/${id}` : `/media/covers/${id}.jpg`;
}

type Props = {
  src: string | null | undefined;
  alt: string;
  /** Ekranda ne kadar yer kapladığına göre: sm ≤ 64px, md ≤ 300px, lg büyük. */
  size?: Size;
  /** `lg` olmayan boyutlarda tarayıcı retina için 640'lığı seçebilsin diye srcset verilir. */
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
};

/**
 * Spotify kapağı: kendi sunucumuzdan, özgün dosya olarak (kalite kaybı yok, optimize hattına takılmaz),
 * yüklenirken iskelet gösterir, yarım/boş kalmasın diye hata durumunda bir kez daha dener ve
 * büyük boyuta düşer. Üst eleman `position: relative` olmalıdır (kapsayıcıyı doldurur).
 */
export function CoverImage({ src, alt, size = "md", sizes, priority = false, fit = "cover", className }: Props) {
  const [loaded, setLoaded] = useState(false);
  // attempt 0: istenen boyut · 1: aynı boyut yeniden (önbellek bozulmasına karşı) · 2: 640'lık · 3: vazgeç
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setAttempt(0);
  }, [src]);

  // Hydration'dan önce yüklenmiş (önbellekteki) görsel için onLoad kaçmış olabilir.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src, attempt]);

  const onError = useCallback(() => setAttempt((a) => a + 1), []);

  if (!src) return <span className={`${styles.wrap} ${styles.empty}`} aria-hidden="true" />;

  const wanted: Size = attempt >= 2 ? "lg" : size;
  const url = coverUrl(src, wanted);
  const srcSet =
    attempt < 2 && size === "md" && PATTERN.test(src)
      ? `${coverUrl(src, "md")} 300w, ${coverUrl(src, "lg")} 640w`
      : undefined;

  return (
    <span className={styles.wrap}>
      {attempt < 3 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${url}-${attempt}`}
          ref={ref}
          src={url}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          className={`${styles.img} ${fit === "contain" ? styles.contain : ""} ${loaded ? styles.loaded : ""} ${className ?? ""}`}
          onLoad={() => setLoaded(true)}
          onError={onError}
        />
      ) : null}
      {!loaded ? <span className={styles.skeleton} aria-hidden="true" /> : null}
    </span>
  );
}
