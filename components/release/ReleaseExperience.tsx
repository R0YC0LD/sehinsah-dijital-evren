"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ReleaseActions } from "@/components/music/ReleaseActions";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import styles from "./ReleaseExperience.module.css";

export type ExperienceTrack = {
  id: string;
  name: string;
  durationLabel: string;
  explicit: boolean;
  videoId: string | null;
  spotifyUrl: string;
};

type Props = {
  release: {
    id: string;
    name: string;
    coverUrl: string | null;
    typeLabel: string;
    dateLabel: string;
    spotifyUrl: string;
  };
  artists: Array<{ id: string; name: string }>;
  tracks: ExperienceTrack[];
  /** Sürüm genelinde varsayılan klip. */
  releaseVideoId: string | null;
  totalDurationLabel: string;
  label: string | null;
  copyrights: string[];
};

/**
 * Kullanıcı oynat'a bastığında iframe oluşturulur; bu bir kullanıcı hareketi olduğu için
 * tarayıcılar sesli başlatmaya izin verir (sessiz otomatik oynatma + "sesi aç" düğmesi yok).
 */
function youtubeSrc(id: string, origin: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function ReleaseExperience({
  release,
  artists,
  tracks,
  releaseVideoId,
  totalDurationLabel,
  label,
  copyrights,
}: Props) {
  const { pausePlayback } = useSpotifyPlayback();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const embedRef = useRef<HTMLIFrameElement>(null);

  const singleTrack = tracks.length === 1 ? tracks[0] : null;
  const [activeTrackId, setActiveTrackId] = useState<string | null>(
    singleTrack ? singleTrack.id : null,
  );
  const [playing, setPlaying] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [posterFallback, setPosterFallback] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) ?? null,
    [tracks, activeTrackId],
  );
  const videoId = activeTrack ? activeTrack.videoId : releaseVideoId;
  const clipTitle = activeTrack?.name ?? release.name;

  // Video değişince poster/yükleme durumu sıfırlanır.
  useEffect(() => {
    setFrameReady(false);
    setPosterFallback(false);
  }, [videoId]);

  const embedUri = activeTrack
    ? `https://open.spotify.com/embed/track/${activeTrack.id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/album/${release.id}?utm_source=generator&theme=0`;
  const embedHeight = activeTrack ? 152 : tracks.length > 1 ? 352 : 152;

  /** Klip sesli başlayacağı için sitenin Spotify çalması klibin üstüne binmesin. */
  const startClip = useCallback(() => {
    pausePlayback();
    setPlaying(true);
  }, [pausePlayback]);

  // Spotify oynatıcısına odaklanılırsa (tıklanırsa) klip duraklatılır: iki ses üst üste binmesin.
  useEffect(() => {
    if (!playing) return;
    const onBlur = () => {
      window.setTimeout(() => {
        if (embedRef.current && document.activeElement === embedRef.current) {
          frameRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*",
          );
        }
      }, 0);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [playing]);

  const selectTrack = (track: ExperienceTrack) => {
    const same = track.id === activeTrackId && tracks.length > 1;
    const nextId = same ? null : track.id;
    setActiveTrackId(nextId);

    const nextVideo = nextId === null ? releaseVideoId : track.videoId;
    if (nextId !== null && nextVideo) {
      // Parçaya basmak da bir oynat hareketidir: klip sesli başlar.
      startClip();
      // Küçük ekranlarda liste sahnenin altında; klip görünsün.
      if (window.matchMedia("(max-width: 899px)").matches) {
        stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setPlaying(false);
    }
  };

  const artistLine = artists.map((a, i) => (
    <span key={a.id || a.name}>
      {i > 0 ? (i === artists.length - 1 ? " & " : ", ") : ""}
      {a.id ? (
        <a
          href={`https://open.spotify.com/artist/${a.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.artist}
        >
          {a.name}
        </a>
      ) : (
        a.name
      )}
    </span>
  ));

  const showFrame = Boolean(videoId) && playing;

  return (
    <div className={styles.grid}>
      <div className={styles.media}>
        <div ref={stageRef} className={styles.screen}>
          {videoId ? (
            <>
              <button
                type="button"
                className={`${styles.poster} ${showFrame && frameReady ? styles.posterHidden : ""}`}
                onClick={startClip}
                aria-label={`Klibi oynat: ${clipTitle}`}
                tabIndex={showFrame ? -1 : 0}
                aria-hidden={showFrame && frameReady}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`${videoId}-${posterFallback ? "mq" : "max"}`}
                  className={styles.posterImage}
                  src={`https://i.ytimg.com/vi/${videoId}/${posterFallback ? "mqdefault" : "maxresdefault"}.jpg`}
                  alt=""
                  loading="eager"
                  decoding="async"
                  onError={() => setPosterFallback(true)}
                  onLoad={(e) => {
                    // maxresdefault yoksa YouTube 120×90'lık gri bir yer tutucu döndürür.
                    if (!posterFallback && e.currentTarget.naturalWidth <= 200) setPosterFallback(true);
                  }}
                />
                <span className={styles.shade} aria-hidden="true" />
                <span className={styles.playWrap} aria-hidden="true">
                  <span className={styles.ring} />
                  <span className={styles.play}>
                    <svg viewBox="0 0 24 24" className={styles.playIcon} focusable="false">
                      <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
                    </svg>
                  </span>
                </span>
                <span className={styles.posterLabel}>
                  <span className={styles.posterKicker}>KLİP</span>
                  <span className={styles.posterTitle}>{clipTitle}</span>
                </span>
                {showFrame && !frameReady ? <span className={styles.spinner} aria-hidden="true" /> : null}
              </button>

              {showFrame ? (
                <iframe
                  key={videoId}
                  ref={frameRef}
                  className={`${styles.frame} ${frameReady ? styles.frameReady : ""}`}
                  src={youtubeSrc(videoId, origin)}
                  title={`${clipTitle} — klip`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setFrameReady(true)}
                />
              ) : null}
            </>
          ) : (
            <div className={styles.coverStage}>
              {release.coverUrl ? (
                <Image
                  src={release.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 899px) 100vw, 60vw"
                  className={styles.coverBackdrop}
                  aria-hidden="true"
                />
              ) : null}
              <div className={styles.coverArt}>
                {release.coverUrl ? (
                  <Image
                    src={release.coverUrl}
                    alt={`${release.name} albüm kapağı`}
                    fill
                    priority
                    sizes="(max-width: 899px) 70vw, 340px"
                    className={styles.coverImage}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        {videoId ? (
          <a
            className={`editorial-link ${styles.watch}`}
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            YOUTUBE’DA İZLE ↗
          </a>
        ) : null}

        {tracks.length > 1 ? (
          <ol className={styles.tracks} aria-label="Parça listesi">
            {tracks.map((track, index) => (
              <li key={track.id}>
                <button
                  type="button"
                  className={`${styles.track} ${track.id === activeTrackId ? styles.trackActive : ""}`}
                  onClick={() => selectTrack(track)}
                  aria-pressed={track.id === activeTrackId}
                >
                  <span className={styles.trackNo}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.trackName}>
                    {track.name}
                    {track.explicit ? <span className={styles.explicit}>E</span> : null}
                  </span>
                  {track.videoId ? <span className={styles.clipBadge}>KLİP</span> : null}
                  <span className={styles.trackTime}>{track.durationLabel}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className={styles.info}>
        <p className="meta-label">
          {release.dateLabel} · {release.typeLabel}
        </p>
        <h1 className={`display ${styles.title}`}>{release.name}</h1>
        <p className={styles.artists}>{artistLine}</p>

        <dl className={styles.facts}>
          <div>
            <dt>ÇIKIŞ TARİHİ</dt>
            <dd>{release.dateLabel}</dd>
          </div>
          <div>
            <dt>TÜR</dt>
            <dd>{release.typeLabel}</dd>
          </div>
          {tracks.length > 1 ? (
            <div>
              <dt>PARÇA</dt>
              <dd>{tracks.length}</dd>
            </div>
          ) : null}
          {totalDurationLabel ? (
            <div>
              <dt>SÜRE</dt>
              <dd>{totalDurationLabel}</dd>
            </div>
          ) : null}
          {label ? (
            <div>
              <dt>ETİKET</dt>
              <dd>{label}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.actions}>
          <a
            href={activeTrack?.spotifyUrl ?? release.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primary}
          >
            SPOTIFY’DA DİNLE ↗
          </a>
          <ReleaseActions
            id={release.id}
            type="album"
            name={release.name}
            spotifyUrl={release.spotifyUrl}
          />
        </div>

        <div className={styles.embed}>
          <iframe
            key={embedUri}
            ref={embedRef}
            title={`${clipTitle} — Spotify`}
            src={embedUri}
            width="100%"
            height={embedHeight}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className={styles.embedFrame}
          />
        </div>

        {copyrights.length ? (
          <div className={styles.copyrights}>
            {copyrights.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
