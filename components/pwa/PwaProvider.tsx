"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  /** Tarayıcı yükleme penceresini açabilir (Chrome/Edge/Android). */
  canInstall: boolean;
  /** iOS/Safari: otomatik yükleme penceresi yok, "Ana Ekrana Ekle" talimatı gerekir. */
  isIos: boolean;
  /** Uygulama zaten ana ekrandan (standalone) açık. */
  isStandalone: boolean;
  install: () => Promise<boolean>;
};

const PwaContext = createContext<PwaState>({
  canInstall: false,
  isIos: false,
  isStandalone: false,
  install: async () => false,
});

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ kendini Mac olarak tanıtır; dokunmatik ekranla ayırt edilir.
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Service worker kaydı + "uygulamayı yükle" durumu. Service worker yalnızca production'da
 * kaydedilir (geliştirmede eski önbellek/karışıklık olmasın).
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIos(detectIos());
    setIsStandalone(detectStandalone());

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* kayıt başarısız olursa site normal çalışır */
      });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferred.current;
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferred.current = null;
    setCanInstall(false);
    return outcome === "accepted";
  }, []);

  const value = useMemo(() => ({ canInstall, isIos, isStandalone, install }), [canInstall, isIos, isStandalone, install]);
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  return useContext(PwaContext);
}
