"use client";

import { useEffect, useMemo, useRef } from "react";
import { FeaturedTrackRow } from "@/components/music/FeaturedTrackRow";
import { PreviewCursor } from "@/components/music/PreviewCursor";
import { RandomTrackPicker } from "@/components/music/RandomTrackPicker";
import { useAudioPreviewContext } from "@/components/providers/AudioPreviewProvider";
import {
  featuredTrackIds,
  type FeaturedTrack,
} from "@/data/featured-tracks";
import { siteConfig } from "@/data/site";
import type { MusicCatalog } from "@/lib/spotify/types";
import { isDirectSpotifyTrackUrl } from "@/lib/spotify/validate-links";
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
    const byId = new Map(catalog.tracks.map((t) => [t.id, t]));
    const configured: FeaturedTrack[] = [];

    for (const cfg of featuredTrackIds) {
      const t = byId.get(cfg.spotifyTrackId);
      if (!t) continue;
      if (!t.verified || !isDirectSpotifyTrackUrl(t.spotifyUrl, t.spotifyId || t.id)) {
        continue;
      }
      configured.push({
        id: t.id,
        title: t.name,
        releaseTitle: t.albumName,
        spotifyUrl: t.spotifyUrl,
        coverUrl: t.imageUrl || undefined,
        previewSrc: cfg.previewSrc,
        previewStart: cfg.previewStart,
        previewDuration: cfg.previewDuration || siteConfig.audioPreview.defaultDuration,
        verified: true,
      });
    }

    if (configured.length) return configured;

    return catalog.tracks
      .filter(
        (t) =>
          t.verified &&
          t.containsTargetArtist &&
          isDirectSpotifyTrackUrl(t.spotifyUrl, t.spotifyId || t.id),
      )
      .slice(0, 8)
      .map(
        (t): FeaturedTrack => ({
          id: t.id,
          title: t.name,
          releaseTitle: t.albumName,
          spotifyUrl: t.spotifyUrl,
          coverUrl: t.imageUrl || undefined,
          previewSrc: undefined,
          previewDuration: siteConfig.audioPreview.defaultDuration,
          verified: true,
        }),
      );
  }, [catalog.tracks]);

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

  if (!tracks.length) {
    return <RandomTrackPicker tracks={catalog.tracks} />;
  }

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

      <RandomTrackPicker tracks={catalog.tracks} />
      {!isTouch ? <PreviewCursor rootRef={listRef} enabled={enabled} /> : null}
    </div>
  );
}
