"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotify } from "@/components/notify/NotifyProvider";
import { usePwa } from "@/components/pwa/PwaProvider";
import styles from "./NotifyDialog.module.css";

const TOPIC_COPY = {
  releases: { title: "Yeni parça / albüm", text: "Yeni bir şarkı ya da proje yayınlandığında." },
  concerts: { title: "Yeni konser", text: "Yeni bir konser ya da etkinlik takvime eklendiğinde." },
} as const;

/** Bildirim ayarları penceresi: konu seçimi, aç/kapat, test, uygulama yükleme. */
export function NotifyDialog() {
  const { status, topics, busy, message, isBrave, closeDialog, setTopics, enable, disable, sendTest } = useNotify();
  const { canInstall, isIos, isStandalone, install } = usePwa();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [closeDialog]);

  const on = status === "on";
  const canToggle = status === "off" || status === "on";

  return createPortal(
    <div className={styles.backdrop} onClick={closeDialog}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={closeDialog} aria-label="Kapat">
          ✕
        </button>

        <p className="meta-label">HABER VER</p>
        <h2 id="notify-title" className={`display ${styles.title}`}>
          BİLDİRİMLER
        </h2>
        <p className={styles.lead}>
          Yeni parça ya da konser çıkınca cihazına haber verelim. Gece rahatsız etmeyiz: bildirimler yalnızca 09:00–22:00 arasında gelir.
        </p>

        {status === "needs-install" ? (
          <div className={styles.note}>
            <strong>iPhone / iPad’de önce uygulamayı ana ekrana ekle:</strong>
            <ol>
              <li>Safari’de alttaki <b>Paylaş</b> düğmesine dokun.</li>
              <li><b>Ana Ekrana Ekle</b>’yi seç.</li>
              <li>Ana ekrandaki Şehinşah uygulamasını aç ve buradan bildirimleri aç.</li>
            </ol>
          </div>
        ) : null}

        {status === "unsupported" ? (
          <p className={styles.note}>Bu tarayıcı bildirimleri desteklemiyor. Chrome, Edge, Firefox ya da (ana ekrana eklenmiş) Safari dene.</p>
        ) : null}

        {status === "denied" ? (
          <p className={styles.note}>
            Bildirimler tarayıcıda engellenmiş. Adres çubuğundaki kilit simgesine dokunup bu site için bildirimlere izin ver, sonra tekrar dene.
          </p>
        ) : null}

        {canToggle || status === "loading" ? (
          <fieldset className={styles.topics} disabled={busy}>
            <legend className="sr-only">Hangi konularda haber verelim?</legend>
            {(Object.keys(TOPIC_COPY) as Array<keyof typeof TOPIC_COPY>).map((key) => (
              <label key={key} className={styles.topic}>
                <input
                  type="checkbox"
                  checked={topics[key]}
                  onChange={(e) => void setTopics({ ...topics, [key]: e.target.checked })}
                />
                <span className={styles.box} aria-hidden="true" />
                <span className={styles.topicText}>
                  <span className={styles.topicTitle}>{TOPIC_COPY[key].title}</span>
                  <span className={styles.topicSub}>{TOPIC_COPY[key].text}</span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        <div className={styles.actions}>
          {status === "off" ? (
            <button type="button" className={styles.primary} onClick={() => void enable()} disabled={busy}>
              {busy ? "AÇILIYOR…" : "BİLDİRİMLERİ AÇ"}
            </button>
          ) : null}
          {on ? (
            <>
              <span className={styles.badge}>● BİLDİRİMLER AÇIK</span>
              <button type="button" className={styles.secondary} onClick={() => void sendTest()} disabled={busy}>
                TEST BİLDİRİMİ GÖNDER
              </button>
              <button type="button" className={styles.secondary} onClick={() => void disable()} disabled={busy}>
                KAPAT
              </button>
            </>
          ) : null}
        </div>

        {message ? (
          <p className={styles.message} role="status" aria-live="polite">
            {message}
          </p>
        ) : null}

        {isBrave && status !== "on" ? (
          <p className={styles.fine}>
            Brave: bildirimler için Ayarlar → Gizlilik ve güvenlik → “Push mesajları için Google hizmetlerini kullan” açık olmalı.
          </p>
        ) : null}

        <div className={styles.install}>
          {isStandalone ? (
            <span className={styles.fine}>✓ Uygulamayı ana ekrandan kullanıyorsun.</span>
          ) : canInstall ? (
            <button type="button" className={styles.secondary} onClick={() => void install()}>
              UYGULAMAYI YÜKLE
            </button>
          ) : isIos ? (
            <span className={styles.fine}>Uygulama olarak eklemek için: Paylaş → Ana Ekrana Ekle.</span>
          ) : (
            <span className={styles.fine}>İpucu: tarayıcı menüsünden “Uygulamayı yükle” ile ana ekrana ekleyebilirsin.</span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
