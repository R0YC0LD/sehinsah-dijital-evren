"use client";

import { useMemo, useRef } from "react";
import type { VerifiedSingleTrack } from "@/lib/spotify/types";

const OPENING_KEY = "sehinsah-last-opening-track-v1";

let sessionQueue: VerifiedSingleTrack[] | null = null;
let sessionIndex = 0;
let sessionKey = "";

function shuffleTracks(tracks: VerifiedSingleTrack[]): VerifiedSingleTrack[] {
  const copy = [...tracks];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const random = new Uint32Array(1);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(random);
    } else {
      random[0] = Math.floor(Math.random() * 0xffffffff);
    }
    const j = random[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueTracks(tracks: VerifiedSingleTrack[]): VerifiedSingleTrack[] {
  return Array.from(new Map(tracks.map((t) => [t.id, t])).values());
}

function avoidSameOpening(queue: VerifiedSingleTrack[]): VerifiedSingleTrack[] {
  if (queue.length < 2 || typeof window === "undefined") return queue;
  let previous = "";
  try {
    previous = localStorage.getItem(OPENING_KEY) || "";
  } catch {
    previous = "";
  }
  if (!previous || queue[0].id !== previous) return queue;
  const swapWith = queue.findIndex((t, i) => i > 0 && t.id !== previous);
  if (swapWith <= 0) return queue;
  const next = [...queue];
  [next[0], next[swapWith]] = [next[swapWith], next[0]];
  return next;
}

export function persistOpeningTrack(id: string) {
  try {
    localStorage.setItem(OPENING_KEY, id);
  } catch {
    /* ignore */
  }
}

export function useRandomSpotifyQueue(tracks: VerifiedSingleTrack[]) {
  const verified = useMemo(
    () =>
      uniqueTracks(
        tracks.filter(
          (t) =>
            t.verified === true &&
            t.containsTargetArtist === true &&
            t.targetArtistIsPrimary === true &&
            t.uri === `spotify:track:${t.id}` &&
            String(t.spotifyUrl).includes(`/track/${t.id}`) &&
            !String(t.spotifyUrl).includes("/search/"),
        ),
      ),
    [tracks],
  );

  const key = verified.map((t) => t.id).join(",");
  if (verified.length && key !== sessionKey) {
    sessionKey = key;
    sessionQueue = avoidSameOpening(shuffleTracks(verified));
    sessionIndex = 0;
    if (sessionQueue[0]) persistOpeningTrack(sessionQueue[0].id);
  }

  const queueRef = useRef(sessionQueue || []);
  const indexRef = useRef(sessionIndex);
  queueRef.current = sessionQueue || [];
  indexRef.current = sessionIndex;

  const verifiedUriSet = useMemo(
    () => new Set<string>(verified.map((t) => t.uri)),
    [verified],
  );

  const getCurrent = () => {
    const q = sessionQueue || [];
    return q[sessionIndex] || null;
  };

  const getNext = () => {
    const base = sessionQueue || [];
    if (!base.length) return null;
    const lastId = getCurrent()?.id;
    sessionIndex += 1;
    if (sessionIndex >= base.length) {
      let reshuffled = shuffleTracks(verified);
      if (reshuffled.length > 1 && lastId && reshuffled[0].id === lastId) {
        const swapWith = reshuffled.findIndex((t) => t.id !== lastId);
        if (swapWith > 0) {
          [reshuffled[0], reshuffled[swapWith]] = [
            reshuffled[swapWith],
            reshuffled[0],
          ];
        }
      }
      sessionQueue = reshuffled;
      sessionIndex = 0;
    }
    let next = getCurrent();
    if (next && lastId && next.id === lastId && (sessionQueue?.length || 0) > 1) {
      sessionIndex += 1;
      if (sessionQueue && sessionIndex >= sessionQueue.length) sessionIndex = 0;
      next = getCurrent();
    }
    indexRef.current = sessionIndex;
    queueRef.current = sessionQueue || [];
    return next;
  };

  const peekNext = () => {
    const q = sessionQueue || [];
    if (!q.length) return null;
    const i = sessionIndex + 1;
    if (i < q.length) return q[i];
    return q.find((t) => t.id !== getCurrent()?.id) || null;
  };

  return {
    verified,
    verifiedUriSet,
    queueRef,
    indexRef,
    getCurrent,
    getNext,
    peekNext,
  };
}
