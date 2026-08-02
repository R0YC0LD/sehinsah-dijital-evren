"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { siteConfig } from "@/data/site";
import styles from "./SpotifyArtistEmbed.module.css";

export function SpotifyArtistEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "180px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h3 className={`display ${styles.title}`}>{siteConfig.music.popularTitle}</h3>
          <p className={styles.sub}>{siteConfig.music.popularSubtitle}</p>
        </div>
        <ExternalLink
          href={siteConfig.links.spotifyArtist}
          className={styles.open}
          aria-label="Spotify’da aç (yeni sekme)"
        >
          {siteConfig.music.openCta}
        </ExternalLink>
      </div>

      <div className={styles.frame}>
        {failed ? (
          <div className={styles.compactFallback}>
            <p>{siteConfig.music.fallbackMessage}</p>
            <ExternalLink href={siteConfig.links.spotifyArtist}>
              {siteConfig.music.openCta}
            </ExternalLink>
          </div>
        ) : load ? (
          <iframe
            title="Şehinşah Spotify sanatçı oynatıcısı"
            src={siteConfig.spotify.embedUrl}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className={styles.iframe}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className={styles.skeleton} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
