"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import { entropyConfig } from "@/data/entropy";
import { useEntropySound } from "@/hooks/useEntropySound";
import {
  DEEP_TOTAL,
  deepBrainFor,
  readDeepCollected,
  readDeepCompleted,
  readDeepSeed,
  writeDeepCollected,
  writeDeepCompleted,
  type DeepPlacement,
} from "@/lib/entropy/deep";
import { assetPath } from "@/lib/paths/assetPath";
import toastStyles from "./EntropyToast.module.css";
import styles from "./DeepEntropyReward.module.css";

type DeepCtx = {
  unlocked: boolean;
  completed: boolean;
  count: number;
  total: number;
  /** Bu yayının sayfasında gösterilecek beyin (yoksa ya da toplandıysa null). */
  brainFor: (releaseId: string) => DeepPlacement | null;
  collect: (releaseId: string) => void;
  openReward: () => void;
};

const Ctx = createContext<DeepCtx>({
  unlocked: false,
  completed: false,
  count: 0,
  total: DEEP_TOTAL,
  brainFor: () => null,
  collect: () => {},
  openReward: () => {},
});

function readAchievement() {
  try {
    return localStorage.getItem(entropyConfig.keys.achievement) === "1";
  } catch {
    return false;
  }
}

/** 1. seviye (ana sayfadaki 5 beyin) tamamlandı mı? Kalıcı başarım ya da bu oturumdaki tamamlanma. */
export function DeepEntropyProvider({ children, level1Completed }: { children: React.ReactNode; level1Completed: boolean }) {
  const { playCollect } = useEntropySound();
  const [seed, setSeed] = useState("");
  const [collected, setCollected] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [achievement, setAchievement] = useState(false);
  const [toast, setToast] = useState<{ count: number; visible: boolean } | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const collecting = useRef(new Set<string>());

  useEffect(() => {
    setSeed(readDeepSeed());
    setCollected(readDeepCollected());
    setCompleted(readDeepCompleted());
    setAchievement(readAchievement());
  }, []);

  // 1. seviye bu oturumda bittiğinde kapı hemen açılır.
  const unlocked = level1Completed || achievement;

  const brainFor = useCallback(
    (releaseId: string): DeepPlacement | null => {
      if (!unlocked || completed || collected.includes(releaseId)) return null;
      const brain = deepBrainFor(seed, releaseId);
      return brain.visible ? brain.placement : null;
    },
    [unlocked, completed, collected, seed],
  );

  const collect = useCallback(
    (releaseId: string) => {
      if (!unlocked || completed || collecting.current.has(releaseId)) return;
      if (collected.includes(releaseId)) return;
      collecting.current.add(releaseId);
      playCollect();

      const next = [...collected, releaseId];
      setCollected(next);
      writeDeepCollected(next);

      setToast({ count: next.length, visible: true });
      if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null));
        toastTimer.current = null;
      }, entropyConfig.toastDurationMs);

      if (next.length >= DEEP_TOTAL) {
        writeDeepCompleted();
        setCompleted(true);
        window.setTimeout(() => setRewardOpen(true), 800);
      }
    },
    [collected, completed, playCollect, unlocked],
  );

  useEffect(
    () => () => {
      if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const value = useMemo<DeepCtx>(
    () => ({
      unlocked,
      completed,
      count: collected.length,
      total: DEEP_TOTAL,
      brainFor,
      collect,
      openReward: () => setRewardOpen(true),
    }),
    [unlocked, completed, collected.length, brainFor, collect],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast ? (
        <div
          className={`${toastStyles.toast} ${toast.visible ? toastStyles.visible : ""}`}
          role="status"
          aria-live="polite"
          data-analytics="entropy_deep_progress"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={toastStyles.icon} src={assetPath(entropyConfig.iconSrc)} alt="" width={28} height={28} aria-hidden="true" />
          <div className={toastStyles.copy}>
            <span className={toastStyles.title}>{toast.count >= DEEP_TOTAL ? "DERİN ENTROPİ TAMAMLANDI" : "DERİN ENTROPİ"}</span>
            <span className={toastStyles.counter}>
              {toast.count}/{DEEP_TOTAL}
            </span>
            <span className={toastStyles.subtitle}>
              {toast.count >= DEEP_TOTAL ? "En derin katmana indin." : "Başka yayınlara da bak."}
            </span>
          </div>
          <div className={toastStyles.progress} aria-hidden="true">
            <span className={toastStyles.fill} style={{ width: `${Math.round((toast.count / DEEP_TOTAL) * 100)}%` }} />
          </div>
        </div>
      ) : null}
      {rewardOpen ? <RewardDialog onClose={() => setRewardOpen(false)} /> : null}
    </Ctx.Provider>
  );
}

function RewardDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div ref={ref} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="deep-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          ✕
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.brain} src={assetPath(entropyConfig.iconSrc)} alt="" width={72} height={72} aria-hidden="true" />
        <p className="meta-label">ENTROPİ ARŞİVİ</p>
        <h2 id="deep-title" className={`display ${styles.title}`}>
          DERİN ENTROPİ
        </h2>
        <p className={styles.lead}>
          Beynin en derin katmanına indin ve 5 yayında gizli entropiyi buldun. Bu duvar kağıtları senin.
        </p>
        <div className={styles.cards}>
          <a className={styles.card} href={assetPath("/media/rewards/entropi-telefon.jpg")} download="sehinsah-entropi-telefon.jpg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/media/rewards/entropi-telefon.jpg")} alt="Entropi telefon duvar kağıdı önizleme" loading="lazy" width={117} height={253} />
            <span className={styles.cardLabel}>TELEFON</span>
            <span className={styles.cardSub}>1170 × 2532 · İNDİR ↓</span>
          </a>
          <a className={styles.card} href={assetPath("/media/rewards/entropi-masaustu.jpg")} download="sehinsah-entropi-masaustu.jpg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/media/rewards/entropi-masaustu.jpg")} alt="Entropi masaüstü duvar kağıdı önizleme" loading="lazy" width={256} height={144} />
            <span className={styles.cardLabel}>MASAÜSTÜ</span>
            <span className={styles.cardSub}>2560 × 1440 · İNDİR ↓</span>
          </a>
        </div>
        <p className={styles.fine}>Bu pencereyi menüdeki “ENTROPİ ARŞİVİ” bağlantısından istediğin zaman tekrar açabilirsin.</p>
      </div>
    </div>,
    document.body,
  );
}

/** EntropyProvider içinde kullanılır: 1. seviyenin tamamlanma durumunu okuyup Derin Entropi'yi açar. */
export function DeepEntropy({ children }: { children: React.ReactNode }) {
  const { completed } = useEntropy();
  return <DeepEntropyProvider level1Completed={completed}>{children}</DeepEntropyProvider>;
}

export function useDeepEntropy() {
  return useContext(Ctx);
}
