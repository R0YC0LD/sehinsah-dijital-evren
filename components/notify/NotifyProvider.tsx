"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NotifyDialog } from "@/components/notify/NotifyDialog";
import { usePwa } from "@/components/pwa/PwaProvider";

export type Topics = { releases: boolean; concerts: boolean };

export type NotifyStatus =
  | "loading" // durum kontrol ediliyor
  | "unsupported" // tarayıcı push desteklemiyor
  | "needs-install" // iOS: önce ana ekrana eklenmeli
  | "denied" // kullanıcı izni engelledi
  | "off" // kapalı, açılabilir
  | "on"; // abone

type NotifyContext = {
  /** Hiç sunulabilir mi? (sunucu push'u yapılandırdıysa ve tarayıcı destekliyorsa ya da talimat gerekiyorsa) */
  visible: boolean;
  status: NotifyStatus;
  topics: Topics;
  busy: boolean;
  message: string;
  isBrave: boolean;
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setTopics: (topics: Topics) => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  sendTest: () => Promise<void>;
};

const Ctx = createContext<NotifyContext | null>(null);

const TOPICS_KEY = "sehinsah-notify-topics-v1";
const DEFAULT_TOPICS: Topics = { releases: true, concerts: true };

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function readTopics(): Topics {
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (!raw) return DEFAULT_TOPICS;
    const parsed = JSON.parse(raw) as Partial<Topics>;
    return { releases: parsed.releases !== false, concerts: parsed.concerts !== false };
  } catch {
    return DEFAULT_TOPICS;
  }
}

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  // Geliştirmede SW kaydı yapılmaz; burada kullanıcı bildirimi açarken kaydedilir.
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const { isIos, isStandalone } = usePwa();
  const [status, setStatus] = useState<NotifyStatus>("loading");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [topics, setTopicsState] = useState<Topics>(DEFAULT_TOPICS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [isBrave, setIsBrave] = useState(false);
  const keyRef = useRef<string | null>(null);
  // iOS'ta Safari sekmesi push alamaz; yalnızca ana ekrana eklenmiş uygulama alabilir.
  const needsInstallFlag = useRef(false);
  needsInstallFlag.current = isIos && !isStandalone;

  const refresh = useCallback(async () => {
    if (needsInstallFlag.current) {
      setStatus("needs-install");
      return;
    }
    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub && Notification.permission === "granted" ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }, []);

  useEffect(() => {
    setTopicsState(readTopics());
    setIsBrave(Boolean((navigator as Navigator & { brave?: unknown }).brave));
    void refresh();

    // Sunucu bildirim altyapısını (KV + VAPID) yapılandırmış mı?
    fetch("/api/push/key", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return setAvailable(false);
        const data = (await res.json()) as { publicKey?: string };
        keyRef.current = data.publicKey ?? null;
        setAvailable(Boolean(data.publicKey));
      })
      .catch(() => setAvailable(false));
  }, [refresh, isIos, isStandalone]);

  const saveTopics = (next: Topics) => {
    setTopicsState(next);
    try {
      localStorage.setItem(TOPICS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const post = useCallback(async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  }, []);

  const enable = useCallback(async () => {
    setMessage("");
    if (!pushSupported() || !keyRef.current) {
      setMessage("Bildirimler şu an kullanılamıyor.");
      return;
    }
    if (!topics.releases && !topics.concerts) {
      setMessage("En az bir konu seç.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        setMessage(permission === "denied" ? "" : "İzin verilmedi.");
        return;
      }
      const reg = await getRegistration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyRef.current),
        }));
      const res = await post("/api/push/subscribe", { subscription: sub.toJSON(), topics });
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        setMessage(res.status === 429 ? "Çok fazla deneme. Biraz sonra tekrar dene." : "Abonelik kaydedilemedi. Tekrar dene.");
        setStatus("off");
        return;
      }
      setStatus("on");
      setMessage("Bildirimler açıldı.");
    } catch (error) {
      setMessage(
        error instanceof Error && /push service|registration failed/i.test(error.message)
          ? "Tarayıcı bildirim servisine ulaşamadı. Brave kullanıyorsan Ayarlar → Gizlilik ve güvenlik → “Push mesajları için Google hizmetlerini kullan” seçeneğini aç."
          : "Bildirimler açılamadı. Tekrar dene.",
      );
      void refresh();
    } finally {
      setBusy(false);
    }
  }, [post, refresh, topics]);

  const disable = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await post("/api/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setStatus("off");
      setMessage("Bildirimler kapatıldı.");
    } finally {
      setBusy(false);
    }
  }, [post]);

  const setTopics = useCallback(
    async (next: Topics) => {
      saveTopics(next);
      if (status !== "on") return;
      if (!next.releases && !next.concerts) {
        await disable();
        return;
      }
      setBusy(true);
      try {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) await post("/api/push/subscribe", { subscription: sub.toJSON(), topics: next });
      } finally {
        setBusy(false);
      }
    },
    [disable, post, status],
  );

  const sendTest = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) {
        setMessage("Önce bildirimleri aç.");
        return;
      }
      const res = await post("/api/push/test", { endpoint: sub.endpoint });
      setMessage(
        res.ok
          ? "Test bildirimi gönderildi. Birkaç saniye içinde gelmeli."
          : res.status === 429
            ? "Test limiti doldu. Daha sonra tekrar dene."
            : res.status === 410 || res.status === 404
              ? "Aboneliğin süresi dolmuş. Bildirimleri kapatıp yeniden aç."
              : "Test gönderilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }, [post]);

  const value = useMemo<NotifyContext>(
    () => ({
      visible: available !== false && (status === "needs-install" || status !== "unsupported"),
      status,
      topics,
      busy,
      message,
      isBrave,
      open,
      openDialog: () => {
        setMessage("");
        void refresh();
        setOpen(true);
      },
      closeDialog: () => setOpen(false),
      setTopics,
      enable,
      disable,
      sendTest,
    }),
    [available, status, topics, busy, message, isBrave, open, refresh, setTopics, enable, disable, sendTest],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {open ? <NotifyDialog /> : null}
    </Ctx.Provider>
  );
}

export function useNotify(): NotifyContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotify requires NotifyProvider");
  return ctx;
}
