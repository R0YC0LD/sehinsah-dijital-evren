"use client";

import { useEffect, useState } from "react";
import type { RailConcert } from "@/components/concerts/ConcertRail";
import { downloadIcs, googleCalendarUrl, mapsUrl } from "@/lib/calendar-links";
import { shareOrCopy } from "@/lib/share";
import styles from "./ConcertFeatured.module.css";

type Props = {
  concert: RailConcert;
};

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Sıradaki konser: büyük tarih, canlı geri sayım, bilet ve takvime ekle / yol tarifi eylemleri. */
export function ConcertFeatured({ concert }: Props) {
  const [now, setNow] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const diff = now === null ? null : new Date(concert.startsAt).getTime() - now;
  const started = diff !== null && diff <= 0;
  const parts = diff !== null && diff > 0 ? split(diff) : null;
  const names = concert.lineup;

  const share = async () => {
    const result = await shareOrCopy(`${window.location.origin}/#takvim`, concert.title);
    if (result === "copied") {
      setNote("BAĞLANTI KOPYALANDI");
      window.setTimeout(() => setNote(""), 1800);
    }
  };

  return (
    <article className={styles.panel} aria-label={`Sıradaki konser: ${concert.title}`}>
      <div className={styles.date}>
        <span className={styles.upNext}>
          <span className={styles.dot} aria-hidden="true" />
          SIRADAKİ KONSER
        </span>
        <span className={`display ${styles.day}`}>{concert.day}</span>
        <span className={styles.month}>
          {concert.month} {concert.year}
        </span>
        <span className={styles.weekday}>{concert.weekday}</span>
      </div>

      <div className={styles.main}>
        <div className={styles.badges}>
          {concert.soldOut ? (
            <span className={styles.soldOut}>TÜKENDİ</span>
          ) : (
            <span className={styles.onSale}>BİLETLER SATIŞTA</span>
          )}
          {concert.ageLimit ? <span className={styles.badge}>{concert.ageLimit}</span> : null}
        </div>

        {names.length ? (
          <h3 className={styles.lineup}>
            {names.map((name) => (
              <span key={name} className={`display ${styles.name}`}>
                {name}
              </span>
            ))}
          </h3>
        ) : (
          <h3 className={`display ${styles.title}`}>{concert.title}</h3>
        )}

        <dl className={styles.facts}>
          <div>
            <dt>YER</dt>
            <dd>
              {concert.venue}
              <span className={styles.sub}>{concert.city}</span>
            </dd>
          </div>
          <div>
            <dt>SAAT</dt>
            <dd>
              {concert.time}
              {concert.doors ? <span className={styles.sub}>Kapı {concert.doors}</span> : null}
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.side}>
        <div className={styles.count} role="timer" aria-label="Konsere kalan süre">
          {started ? (
            <p className={`display ${styles.started}`}>BAŞLADI</p>
          ) : (
            <div className={styles.units}>
              {(
                [
                  ["GÜN", parts?.days],
                  ["SAAT", parts?.hours],
                  ["DK", parts?.minutes],
                  ["SN", parts?.seconds],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className={styles.unit}>
                  <span className={`display ${styles.value}`}>
                    {value === undefined ? "--" : label === "GÜN" ? value : pad(value)}
                  </span>
                  <span className={styles.unitLabel}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <a
          href={concert.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
          draggable={false}
        >
          {concert.soldOut ? "BUBİLET’TE GÖR ↗" : "BİLET AL ↗"}
        </a>

        <div className={styles.tools}>
          <button type="button" className={styles.tool} onClick={() => downloadIcs(concert)}>
            TAKVİME EKLE
          </button>
          <a
            className={styles.tool}
            href={googleCalendarUrl(concert)}
            target="_blank"
            rel="noopener noreferrer"
          >
            GOOGLE TAKVİM ↗
          </a>
          <a className={styles.tool} href={mapsUrl(concert)} target="_blank" rel="noopener noreferrer">
            YOL TARİFİ ↗
          </a>
          <button type="button" className={styles.tool} onClick={share}>
            PAYLAŞ
          </button>
        </div>
        {note ? (
          <p className={styles.note} aria-live="polite">
            {note}
          </p>
        ) : null}
      </div>
    </article>
  );
}
