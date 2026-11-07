"use client";

import { useEffect, useState } from "react";
import type { ClickStats } from "@/lib/concerts/clicks";
import type { SyncStatus } from "@/lib/concerts/source";
import styles from "./AdminPanel.module.css";

const POLL_MS = 10_000;

const ACTION_LABELS = {
  ticket: "bilet",
  calendar: "takvim",
  maps: "yol tarifi",
  share: "paylaş",
} as const;

type Stats = ClickStats & { sync: SyncStatus | null };

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
const formatTime = (iso: string) => new Date(iso).toLocaleString("tr-TR");

export function ConcertStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (document.hidden) return;
      fetch("/api/admin/concert-stats", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("failed");
          return res.json();
        })
        .then((data: Stats) => {
          if (!active) return;
          setStats(data);
          setFailed(false);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    };
    load();
    const timer = window.setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  if (!stats) {
    return <p className={styles.statusInline}>{failed ? "Tıklama verisi alınamadı." : "Yükleniyor…"}</p>;
  }

  const ticketTotal = stats.rows.reduce((sum, r) => sum + r.ticket, 0);
  const allTotal = stats.rows.reduce((sum, r) => sum + r.ticket + r.calendar + r.maps + r.share, 0);

  return (
    <section className={styles.statsSection} aria-label="Konser tıklamaları">
      <h2 className={`display ${styles.sectionTitle}`}>KONSER TIKLAMALARI</h2>
      <p className={styles.statsNote}>
        Canlı, 10 saniyede bir yenilenir.{failed ? " Son yenileme başarısız oldu." : ""}
      </p>

      <div className={styles.totals}>
        <div>
          <span className={`display ${styles.totalValue}`}>{stats.totalVisitors}</span>
          <span className={styles.totalLabel}>TIKLAYAN KİŞİ</span>
        </div>
        <div>
          <span className={`display ${styles.totalValue}`}>{ticketTotal}</span>
          <span className={styles.totalLabel}>BİLET TIKLAMASI</span>
        </div>
        <div>
          <span className={`display ${styles.totalValue}`}>{allTotal}</span>
          <span className={styles.totalLabel}>TOPLAM TIKLAMA</span>
        </div>
      </div>

      {stats.rows.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">KONSER</th>
                <th scope="col" className={styles.number}>KİŞİ</th>
                <th scope="col" className={styles.number}>BİLET</th>
                <th scope="col" className={styles.number}>TAKVİM</th>
                <th scope="col" className={styles.number}>YOL</th>
                <th scope="col" className={styles.number}>PAYLAŞ</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.city}
                    <span className={styles.rowSub}>
                      {formatDate(row.startsAt)} · {row.venue}
                    </span>
                  </td>
                  <td className={styles.number}>{row.visitors}</td>
                  <td className={styles.number}>{row.ticket}</td>
                  <td className={styles.number}>{row.calendar}</td>
                  <td className={styles.number}>{row.maps}</td>
                  <td className={styles.number}>{row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.statsNote}>Henüz tıklama yok.</p>
      )}

      {stats.recent.length ? (
        <div className={styles.recent}>
          <p className={styles.totalLabel}>SON TIKLAMALAR</p>
          {stats.recent.map((click) => (
            <p key={`${click.id}-${click.at}`}>
              {formatTime(click.at)} · {click.city} · {ACTION_LABELS[click.action]}
            </p>
          ))}
        </div>
      ) : null}

      <p className={`${styles.statsNote} ${stats.sync && !stats.sync.ok ? styles.syncBad : ""}`}>
        {stats.sync
          ? `Konser botu son tarama: ${formatTime(stats.sync.at)} · ${stats.sync.upcoming} konser · ${
              stats.sync.ok ? "sorunsuz" : "hata, mevcut veri korundu"
            }${stats.sync.warnings.length ? ` · ${stats.sync.warnings[0]}` : ""}`
          : "Konser botu henüz bu sürümle çalışmadı."}
      </p>
    </section>
  );
}
