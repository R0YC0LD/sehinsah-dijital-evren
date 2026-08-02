"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";
import { assetPath } from "@/lib/paths/assetPath";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SESSION_KEY = "sehinsah-loading-done";

export function useLoadingIntro() {
  const reduced = useReducedMotion();
  const cfg = siteConfig.loading;
  const [active, setActive] = useState(() => {
    if (!cfg.enabled || !cfg.showOnInitialDocumentLoad) return false;
    if (typeof window === "undefined") return true;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [readyToAnimate, setReadyToAnimate] = useState(false);

  useEffect(() => {
    if (!active) return;
    document.body.dataset.loading = "true";

    let cancelled = false;
    const start = performance.now();

    const markReady = () => {
      if (cancelled) return;
      setReadyToAnimate(true);
    };

    const waitFonts = document.fonts?.ready?.then(() => undefined).catch(() => undefined);
    const waitImg = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = assetPath(siteConfig.media.falling);
    });

    Promise.race([
      Promise.all([waitFonts, waitImg]),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, cfg.maxCriticalAssetWaitMs);
      }),
    ]).then(() => {
      const elapsed = performance.now() - start;
      const minDelay = reduced ? 40 : 80;
      window.setTimeout(markReady, Math.max(0, minDelay - elapsed));
    });

    return () => {
      cancelled = true;
      delete document.body.dataset.loading;
    };
  }, [active, cfg.maxCriticalAssetWaitMs, reduced]);

  const complete = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    delete document.body.dataset.loading;
    setActive(false);
    window.dispatchEvent(new CustomEvent("sehinsah:loading-complete"));
  };

  return {
    active,
    readyToAnimate,
    reduced,
    complete,
    config: cfg,
  };
}
