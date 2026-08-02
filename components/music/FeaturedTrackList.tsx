"use client";

import { useEffect, useMemo, useRef } from "react";
import { FeaturedTrackRow } from "@/components/music/FeaturedTrackRow";
import { PreviewCursor } from "@/components/music/PreviewCursor";
import { useAudioPreviewContext } from "@/components/providers/AudioPreviewProvider";
import { featuredTracks, type FeaturedTrack } from "@/data/featured-tracks";
import { siteConfig } from "@/data/site";
import type { MusicCatalog } from "@/lib/spotify/types";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import styles from "./FeaturedTrackList.module.css";

type Props = {
  catalog: MusicCatalog;
};

export function FeaturedTrackList({ catalog }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const isTouch = useIsTouchDevice();
  const { enabled, enable, activeId, playPreview, stopPreview } =
    useAudioPreviewContext();

  const tracks = useMemo(() => {
    const fromCatalog: FeaturedTrack[] = catalog.releases.slice(0, 8).map((r) => {
      const configured = featuredTracks.find(
        (f) => f.id === r.id || f.title.toLowerCase() === r.name.toLowerCase(),
      );
      return {
        id: r.id,
        title: r.name,
        releaseTitle: r.albumType === "album" ? "Albüm" : "Tekli",
        spotifyUrl: r.spotifyUrl,
        coverUrl: r.imageUrl || undefined,
        previewDuration:
          configured?.previewDuration || siteConfig.audioPreview.defaultDuration,
        previewSrc: configured?.previewSrc,
      };
    });

    if (fromCatalog.length >= 5) return fromCatalog;
    if (featuredTracks.length) return featuredTracks;
    return fromCatalog;
  }, [catalog.releases]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stopPreview();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stopPreview]);

  useEffect(
    () => () => {
      if (hoverTimer.current != null) window.clearTimeout(hoverTimer.current);
    },
    [],
  );

  return (
    <div ref={listRef} className={`featured-track-list ${styles.wrap}`}>
      <div className={styles.head}>
        <h3 className={`display ${styles.title}`}>{siteConfig.music.featuredTitle}</h3>
        {!enabled ? (
          <button type="button" className={styles.enable} onClick={enable}>
            {siteConfig.music.enableAudioLabel}
          </button>
        ) : (
          <span className={styles.enabled}>SES AÇIK</span>
        )}
      </div>

      <ul className={styles.list}>
        {tracks.map((track, i) => (
          <FeaturedTrackRow
            key={track.id}
            index={String(i + 1).padStart(2, "0")}
            track={track}
            active={activeId === track.id}
            enabled={enabled}
            isTouch={isTouch}
            onHoverStart={() => {
              if (isTouch || !track.previewSrc) return;
              if (hoverTimer.current != null) window.clearTimeout(hoverTimer.current);
              hoverTimer.current = window.setTimeout(() => {
                playPreview(track.id, track.previewSrc, track.previewDuration);
              }, 150);
            }}
            onHoverEnd={() => {
              if (hoverTimer.current != null) window.clearTimeout(hoverTimer.current);
              stopPreview();
            }}
            onToggle={() => {
              if (activeId === track.id) stopPreview();
              else playPreview(track.id, track.previewSrc, track.previewDuration);
            }}
          />
        ))}
      </ul>

      {!isTouch ? <PreviewCursor rootRef={listRef} enabled={enabled} /> : null}
    </div>
  );
}
