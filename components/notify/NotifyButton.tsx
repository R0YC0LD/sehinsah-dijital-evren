"use client";

import { useNotify } from "@/components/notify/NotifyProvider";
import { usePwa } from "@/components/pwa/PwaProvider";

type Props = {
  className?: string;
  /** Kapalıyken gösterilecek etiket. */
  label?: string;
};

/** Bildirim penceresini açar. Sunucu/tarayıcı desteklemiyorsa hiç görünmez. */
export function NotifyButton({ className, label = "BİLDİRİM AÇ" }: Props) {
  const { visible, status, openDialog } = useNotify();
  if (!visible || status === "loading") return null;

  return (
    <button type="button" className={className} onClick={openDialog} aria-haspopup="dialog">
      {status === "on" ? "● BİLDİRİMLER AÇIK" : label}
    </button>
  );
}

/** Tarayıcı yükleme penceresini açabiliyorsa "UYGULAMAYI YÜKLE" düğmesi gösterir. */
export function InstallButton({ className, label = "UYGULAMAYI YÜKLE" }: Props) {
  const { canInstall, isStandalone, install } = usePwa();
  if (!canInstall || isStandalone) return null;
  return (
    <button type="button" className={className} onClick={() => void install()}>
      {label}
    </button>
  );
}
