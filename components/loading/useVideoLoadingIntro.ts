"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type LoaderPhase =
  | "boot"
  | "waiting-for-video"
  | "playing-intro"
  | "playing-fill"
  | "playing-finale"
  | "exiting"
  | "complete";

export function useVideoLoadingIntro() {
  const reduced = useReducedMotion();
  const cfg = siteConfig.loading;
  const [active, setActive] = useState(() => {
    if (!cfg.enabled) return false;
    if (typeof window === "undefined") return true;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("intro") === "1") return true;
      if (cfg.showOncePerSession && sessionStorage.getItem(cfg.sessionKey) === "1") {
        return false;
      }
    } catch {
      /* ignore */
    }
    return Boolean(cfg.showOnInitialDocumentLoad);
  });
  const [phase, setPhase] = useState<LoaderPhase>("boot");
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    setSaveData(Boolean(conn?.saveData));
  }, []);

  useEffect(() => {
    if (!active) return;
    document.body.dataset.loading = "true";
    setPhase("waiting-for-video");
    return () => {
      delete document.body.dataset.loading;
    };
  }, [active]);

  const complete = () => {
    try {
      sessionStorage.setItem(cfg.sessionKey, "1");
    } catch {
      /* ignore */
    }
    delete document.body.dataset.loading;
    setPhase("complete");
    setActive(false);
    window.dispatchEvent(new CustomEvent("sehinsah:loading-complete"));
  };

  return {
    active,
    phase,
    setPhase,
    reduced,
    saveData,
    complete,
    config: cfg,
  };
}
