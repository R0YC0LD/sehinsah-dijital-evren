"use client";

import { useEffect, useId, useRef, useState } from "react";
import { entropyConfig } from "@/data/entropy";
import { assetPath } from "@/lib/paths/assetPath";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import styles from "./EntropyCompletionVideo.module.css";

export function EntropyCompletionVideo() {
  const { videoOpen, closeVideo, registerVideoEl } = useEntropy();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    registerVideoEl(localVideoRef.current);
    return () => registerVideoEl(null);
  }, [registerVideoEl, videoOpen]);

  useEffect(() => {
    if (!videoOpen) {
      setNeedsGesture(false);
      setFailed(false);
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideo();
    };
    window.addEventListener("keydown", onKey);

    const timer = window.setTimeout(() => {
      const video = localVideoRef.current;
      if (!video) return;
      if (video.paused) setNeedsGesture(true);
    }, 900);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [videoOpen, closeVideo]);

  if (!videoOpen) return null;

  const startManually = () => {
    const video = localVideoRef.current;
    if (!video) return;
    void video
      .play()
      .then(() => setNeedsGesture(false))
      .catch(() => setFailed(true));
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label="Tüm Entropiler toplandı"
      data-analytics="entropy_video_open"
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.closeButton}
        aria-label="Entropi videosunu kapat"
        onClick={closeVideo}
        data-analytics="entropy_video_close"
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className={styles.panel}>
        <p id={titleId} className={styles.heading}>
          TÜM ENTROPİLER TOPLANDI
        </p>

        {failed ? (
          <div className={styles.errorPanel}>
            <strong>TÜM ENTROPİLER TOPLANDI</strong>
            <span>Video şu anda açılamadı. Siteye dönebilirsin.</span>
          </div>
        ) : (
          <>
            <video
              ref={localVideoRef}
              className={styles.video}
              src={assetPath(entropyConfig.completionVideoSrc)}
              poster={assetPath(entropyConfig.completionPosterSrc)}
              playsInline
              preload="metadata"
              controls={false}
              onEnded={closeVideo}
              onError={() => setFailed(true)}
              onPlaying={() => setNeedsGesture(false)}
            >
              Tarayıcınız videoyu desteklemiyor.
            </video>
            {needsGesture ? (
              <div className={styles.playFallback}>
                <button type="button" className={styles.playButton} onClick={startManually}>
                  VİDEOYU BAŞLAT
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
