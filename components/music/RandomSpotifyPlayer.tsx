"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import {
  persistOpeningTrack,
  useRandomSpotifyQueue,
} from "@/components/music/useRandomSpotifyQueue";
import { useAudioPreviewContext } from "@/components/providers/AudioPreviewProvider";
import {
  useSpotifyPlayback,
  type SpotifyEmbedController,
} from "@/components/providers/SpotifyPlaybackProvider";
import { siteConfig } from "@/data/site";
import type { VerifiedSingleTrack } from "@/lib/spotify/types";
import styles from "./SpotifyArtistEmbed.module.css";

const END_THRESHOLD_MS = 700;
const IFRAME_API = "https://open.spotify.com/embed/iframe-api/v1";
const SCRIPT_FLAG = "__sehinsahSpotifyIframeApiLoading";

type EmbedController = SpotifyEmbedController;

type IFrameAPI = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: EmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    __sehinsahSpotifyIframeApi?: IFrameAPI;
    [SCRIPT_FLAG]?: boolean;
  }
}

type Props = {
  tracks: VerifiedSingleTrack[];
};

function trackIdFromUri(uri: string) {
  const parts = uri.split(":");
  return parts[parts.length - 1] || "";
}

export function RandomSpotifyPlayer({ tracks }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const currentRef = useRef<VerifiedSingleTrack | null>(null);
  const transitioningRef = useRef(false);
  const userActivatedRef = useRef(false);
  const failedIds = useRef(new Set<string>());
  const retryCount = useRef(0);
  const mountedRef = useRef(true);
  const { stopPreview, activeId } = useAudioPreviewContext();
  const {
    registerController,
    registerHostElement,
    hostElement,
    setReady,
    setPlaying: setPlaybackPlaying,
    setUnlocked,
    setCurrentUri,
    emit,
    playFromUserGesture,
  } = useSpotifyPlayback();

  const { verified, verifiedUriSet, getCurrent, getNext, peekNext } =
    useRandomSpotifyQueue(tracks);

  const [needsGesture, setNeedsGesture] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<VerifiedSingleTrack | null>(null);
  const [upcoming, setUpcoming] = useState<VerifiedSingleTrack | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (activeId) {
      try {
        controllerRef.current?.pause();
      } catch {
        /* ignore */
      }
      setPlaying(false);
      setPlaybackPlaying(false);
      emit({
        type: "stopped",
        trackUri: currentRef.current?.uri || "",
        trackId: currentRef.current?.id || "",
        positionMs: 0,
        durationMs: 0,
        isPaused: true,
        isBuffering: false,
        playing: false,
      });
    }
  }, [activeId, emit, setPlaybackPlaying]);

  // Prefer the gate-visible host so play() works under autoplay policies.
  const preferGateHost = siteConfig.audioGate.enabled;
  const activeHost = preferGateHost
    ? hostElement
    : hostElement || hostRef.current;

  useEffect(() => {
    if (!verified.length) {
      setFailed(true);
      return;
    }

    const startTrack = getCurrent();
    if (!startTrack) {
      setFailed(true);
      return;
    }

    // Wait until a host exists (gate dock mounts first when audioGate is on).
    if (!activeHost) return;

    currentRef.current = startTrack;
    setNowPlaying(startTrack);
    setUpcoming(peekNext());
    persistOpeningTrack(startTrack.id);
    setCurrentUri(startTrack.uri);

    let destroyed = false;
    let playLockTimer: number | null = null;

    const emitPlayback = (
      type: "update" | "started" | "ready" | "stopped",
      data: Record<string, unknown>,
      extras?: Partial<{ playing: boolean; isPaused: boolean; isBuffering: boolean }>,
    ) => {
      const playingURI = String(data.playingURI || currentRef.current?.uri || "");
      const trackId = trackIdFromUri(playingURI) || currentRef.current?.id || "";
      emit({
        type,
        trackUri: playingURI,
        trackId,
        positionMs: Number(data.position) || 0,
        durationMs: Number(data.duration) || 0,
        isPaused: extras?.isPaused ?? Boolean(data.isPaused),
        isBuffering: extras?.isBuffering ?? Boolean(data.isBuffering),
        playing: extras?.playing ?? (!data.isPaused && !data.isBuffering),
      });
    };

    const onPlaybackUpdate = (event: { data: Record<string, unknown> }) => {
      if (destroyed || !mountedRef.current) return;
      const data = event.data || {};
      const duration = Number(data.duration) || 0;
      const position = Number(data.position) || 0;
      const isPaused = Boolean(data.isPaused);
      const isBuffering = Boolean(data.isBuffering);
      const playingURI = String(data.playingURI || "");

      if (playingURI && !verifiedUriSet.has(playingURI)) {
        controllerRef.current?.pause();
        if (currentRef.current && retryCount.current < 2) {
          retryCount.current += 1;
          controllerRef.current?.loadUri(currentRef.current.uri);
        }
        emit({
          type: "stopped",
          trackUri: playingURI,
          trackId: trackIdFromUri(playingURI),
          positionMs: position,
          durationMs: duration,
          isPaused: true,
          isBuffering: false,
          playing: false,
        });
        return;
      }

      emitPlayback("update", data, {
        playing: !isPaused && !isBuffering,
        isPaused,
        isBuffering,
      });

      if (isPaused) {
        setPlaying(false);
        setPlaybackPlaying(false);
        return;
      }

      setPlaying(true);
      setPlaybackPlaying(true);
      setNeedsGesture(false);
      userActivatedRef.current = true;
      setUnlocked(true);

      if (
        duration > 0 &&
        position >= duration - END_THRESHOLD_MS &&
        !isBuffering &&
        !transitioningRef.current
      ) {
        transitioningRef.current = true;
        playNext();
      }
    };

    const onPlaybackStarted = (event: { data: Record<string, unknown> }) => {
      if (destroyed) return;
      const playingURI = String(event.data?.playingURI || "");
      if (playingURI && !verifiedUriSet.has(playingURI)) {
        controllerRef.current?.pause();
        if (currentRef.current && retryCount.current < 2) {
          retryCount.current += 1;
          controllerRef.current?.loadUri(currentRef.current.uri);
        }
        return;
      }
      retryCount.current = 0;
      transitioningRef.current = false;
      setPlaying(true);
      setPlaybackPlaying(true);
      setNeedsGesture(false);
      userActivatedRef.current = true;
      setUnlocked(true);
      emitPlayback("started", event.data || {}, {
        playing: true,
        isPaused: false,
        isBuffering: false,
      });
      if (playLockTimer != null) window.clearTimeout(playLockTimer);
    };

    const playNext = () => {
      let next: VerifiedSingleTrack | null = null;
      for (let i = 0; i < verified.length; i += 1) {
        const candidate = getNext();
        if (!candidate) break;
        if (!failedIds.current.has(candidate.id) && verifiedUriSet.has(candidate.uri)) {
          next = candidate;
          break;
        }
      }
      if (!next) {
        transitioningRef.current = false;
        setFailed(true);
        return;
      }
      currentRef.current = next;
      setNowPlaying(next);
      setUpcoming(peekNext());
      controllerRef.current?.loadUri(next.uri);
      window.setTimeout(() => {
        if (userActivatedRef.current || !needsGesture) {
          try {
            controllerRef.current?.play();
          } catch {
            setNeedsGesture(true);
          }
        }
        playLockTimer = window.setTimeout(() => {
          transitioningRef.current = false;
        }, 1800);
      }, 120);
    };

    const setupController = (IFrameAPI: IFrameAPI) => {
      if (destroyed || !activeHost || controllerRef.current) return;
      const embedHeight = activeHost.id === "sehinsah-spotify-gate-host" ? 80 : 352;
      IFrameAPI.createController(
        activeHost,
        { uri: startTrack.uri, width: "100%", height: embedHeight },
        (controller) => {
          if (destroyed) {
            controller.destroy();
            return;
          }
          controllerRef.current = controller;
          registerController(controller);
          setCurrentUri(startTrack.uri);
          // Mark ready as soon as the controller exists so the gate CTA can call play().
          setReady(true);
          controller.addListener("playback_update", onPlaybackUpdate);
          controller.addListener("playback_started", onPlaybackStarted);
          controller.addListener("ready", () => {
            setReady(true);
            emitPlayback(
              "ready",
              {
                playingURI: startTrack.uri,
                position: 0,
                duration: 0,
                isPaused: true,
                isBuffering: false,
              },
              { playing: false, isPaused: true, isBuffering: false },
            );

            // Soft autoplay probe only when gate is disabled.
            if (siteConfig.audioGate.enabled) {
              setNeedsGesture(true);
              return;
            }

            window.setTimeout(() => {
              if (destroyed || userActivatedRef.current) return;
              try {
                controller.play();
                window.setTimeout(() => {
                  if (!userActivatedRef.current && !destroyed) {
                    setNeedsGesture(true);
                  }
                }, 1000);
              } catch {
                setNeedsGesture(true);
              }
            }, 200);
          });
        },
      );
    };

    const api = window.__sehinsahSpotifyIframeApi;
    if (api) {
      setupController(api);
    } else {
      const previous = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        window.__sehinsahSpotifyIframeApi = IFrameAPI;
        previous?.(IFrameAPI);
        setupController(IFrameAPI);
      };

      if (!window[SCRIPT_FLAG] && !document.querySelector(`script[src="${IFRAME_API}"]`)) {
        window[SCRIPT_FLAG] = true;
        const script = document.createElement("script");
        script.src = IFRAME_API;
        script.async = true;
        script.onerror = () => setFailed(true);
        document.body.appendChild(script);
      } else if (window.__sehinsahSpotifyIframeApi) {
        setupController(window.__sehinsahSpotifyIframeApi);
      }
    }

    // Global gesture unlock is owned by MusicStartGate when enabled.
    const onFirstGesture = () => {
      if (siteConfig.audioGate.enabled) return;
      userActivatedRef.current = true;
      setNeedsGesture(false);
      stopPreview();
      try {
        controllerRef.current?.play();
      } catch {
        /* ignore */
      }
    };

    if (!siteConfig.audioGate.enabled) {
      window.addEventListener("pointerdown", onFirstGesture, { once: true });
      window.addEventListener("keydown", onFirstGesture, { once: true });
    }

    return () => {
      destroyed = true;
      if (playLockTimer != null) window.clearTimeout(playLockTimer);
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      try {
        controllerRef.current?.removeListener("playback_update", onPlaybackUpdate);
        controllerRef.current?.removeListener("playback_started", onPlaybackStarted);
        controllerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      controllerRef.current = null;
      registerController(null);
      setReady(false);
    };
    // Boot when track list / host becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified.length, activeHost]);

  const startManually = () => {
    userActivatedRef.current = true;
    setNeedsGesture(false);
    stopPreview();
    const ok = playFromUserGesture();
    if (ok) {
      setPlaying(true);
      setPlaybackPlaying(true);
      setUnlocked(true);
    } else {
      setNeedsGesture(true);
    }
  };

  const skipNext = () => {
    userActivatedRef.current = true;
    transitioningRef.current = true;
    const next = getNext();
    if (!next || !verifiedUriSet.has(next.uri)) {
      transitioningRef.current = false;
      return;
    }
    currentRef.current = next;
    setNowPlaying(next);
    setUpcoming(peekNext());
    controllerRef.current?.loadUri(next.uri);
    window.setTimeout(() => {
      controllerRef.current?.play();
      transitioningRef.current = false;
    }, 120);
  };

  if (!verified.length || failed) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div>
            <h3 className={`display ${styles.title}`}>{siteConfig.music.popularTitle}</h3>
            <p className={styles.sub}>Şehinşah single listesi şu anda yenileniyor.</p>
          </div>
          <ExternalLink href={siteConfig.links.spotifyArtist} className={styles.open}>
            {siteConfig.music.openCta}
          </ExternalLink>
        </div>
        <div className={styles.frame}>
          <div className={styles.compactFallback}>
            <p>{siteConfig.music.fallbackMessage}</p>
            <ExternalLink href={siteConfig.links.spotifyArtist}>
              {siteConfig.music.openCta}
            </ExternalLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h3 className={`display ${styles.title}`}>{siteConfig.music.popularTitle}</h3>
          <p className={styles.sub}>
            {nowPlaying ? (
              <>
                ŞİMDİ ÇALIYOR · {nowPlaying.name}
                {upcoming ? ` · SIRADAKİ ${upcoming.name}` : ""}
              </>
            ) : (
              siteConfig.music.popularSubtitle
            )}
          </p>
        </div>
        <div className={styles.actions}>
          {needsGesture ? (
            <button type="button" className={styles.control} onClick={startManually}>
              MÜZİĞİ BAŞLAT
            </button>
          ) : (
            <span className={`${styles.status} ${playing ? styles.statusLive : ""}`}>
              {playing ? "ÇALIYOR" : "HAZIR"}
            </span>
          )}
          <button type="button" className={styles.control} onClick={skipNext}>
            SIRADAKİ
          </button>
          {nowPlaying ? (
            <ExternalLink
              href={nowPlaying.spotifyUrl}
              className={styles.open}
              aria-label={`${nowPlaying.name} parçasını Spotify’da aç`}
            >
              {siteConfig.music.openCta}
            </ExternalLink>
          ) : null}
        </div>
      </div>

      <div className={styles.frame}>
        <div
          ref={(el) => {
            hostRef.current = el;
            if (!preferGateHost && !hostElement) registerHostElement(el);
          }}
          className={styles.iframeHost}
        />
        {preferGateHost ? (
          <p className={styles.sub} style={{ padding: "0.85rem 1rem" }}>
            Spotify oynatıcı giriş ekranından yönetilir. Müzik başladıysa burada sıradaki
            parçaya geçebilirsin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
