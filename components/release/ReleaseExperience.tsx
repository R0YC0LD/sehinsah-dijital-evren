"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ReleaseActions } from "@/components/music/ReleaseActions";
import { useSpotifyPlayback } from "@/components/providers/SpotifyPlaybackProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  lyrics: Record<string, { text: string; credit?: string }>;
};

type SaveDataConnection = { saveData?: boolean };

function youtubeSrc(id: string, autoplay: boolean, muted: boolean, origin: string) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    loop: "1",
    playlist: id,
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
  lyrics,
}: Props) {
  const reduced = useReducedMotion();
  const { pausePlayback } = useSpotifyPlayback();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mutedRef = useRef(true);

  const singleTrack = tracks.length === 1 ? tracks[0] : null;
  const [activeTrackId, setActiveTrackId] = useState<string | null>(
    singleTrack ? singleTrack.id : null,
  );
  const [muted, setMuted] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: SaveDataConnection }).connection;
    setAutoplay(!connection?.saveData);
    setOrigin(window.location.origin);
    setMounted(true);
  }, []);

  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) ?? null,
    [tracks, activeTrackId],
  );

  const videoId = activeTrack ? activeTrack.videoId : releaseVideoId;
  const shouldAutoplay = autoplay && !reduced;
  // Ses açık/kapalı durumu src'yi değiştirmesin (klip baştan başlamasın): src yalnızca
  // video değişince yeniden hesaplanır, mute komutu postMessage ile gider.
  const frameSrc = useMemo(
    () => (videoId ? youtubeSrc(videoId, shouldAutoplay, mutedRef.current, origin) : ""),
    [videoId, shouldAutoplay, origin],
  );

  const embedUri = activeTrack
    ? `https://open.spotify.com/embed/track/${activeTrack.id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/album/${release.id}?utm_source=generator&theme=0`;
  const embedHeight = activeTrack ? 152 : tracks.length > 1 ? 352 : 152;

  const lyricsEntry = activeTrack ? lyrics[activeTrack.id] : undefined;

  const toggleSound = useCallback(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    const next = !muted;
    frame.postMessage(
      JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }),
      "*",
    );
    if (!next) {
      // Klip sesi açılınca sitenin Spotify çalması klibin üstüne binmesin.
      pausePlayback();
    }
    mutedRef.current = next;
    setMuted(next);
  }, [muted, pausePlayback]);

  const selectTrack = (id: string) => {
    setActiveTrackId((prev) => (prev === id && tracks.length > 1 ? null : id));
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

  return (
    <div className={styles.grid}>
      <div className={styles.media}>
        <div className={styles.screen}>
          {videoId ? (
            <>
              {mounted ? (
                <iframe
                  key={videoId}
                  ref={iframeRef}
                  className={styles.frame}
                  src={frameSrc}
                  title={`${release.name} — klip`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.frame}
                  src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                  alt={`${release.name} klip kapağı`}
                />
              )}
              {mounted ? (
                <button
                  type="button"
                  className={styles.sound}
                  onClick={toggleSound}
                  aria-pressed={!muted}
                >
                  {muted ? "SESİ AÇ" : "SESİ KAPAT"}
                </button>
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
                  onClick={() => selectTrack(track.id)}
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
            title={`${activeTrack?.name ?? release.name} — Spotify`}
            src={embedUri}
            width="100%"
            height={embedHeight}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className={styles.embedFrame}
          />
        </div>

        <section className={styles.lyrics} aria-label="Sözler">
          <h2 className={`display ${styles.lyricsTitle}`}>SÖZLER</h2>
          {lyricsEntry ? (
            <>
              <p className={styles.lyricsText}>{lyricsEntry.text}</p>
              {lyricsEntry.credit ? <p className={styles.credit}>{lyricsEntry.credit}</p> : null}
            </>
          ) : (
            <p className={styles.lyricsNote}>
              Sözler telif kapsamında olduğu için burada yayınlanmıyor. Spotify uygulamasında şarkıyı
              açıp zamanlı sözlerle birlikte dinleyebilirsin.
              <a
                className={`editorial-link ${styles.lyricsLink}`}
                href={activeTrack?.spotifyUrl ?? release.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                SÖZLERLE DİNLE ↗
              </a>
            </p>
          )}
        </section>

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
