"use client";

import { useEffect, useState } from "react";
import { ConcertFeatured } from "@/components/concerts/ConcertFeatured";
import { ConcertRail, type RailConcert } from "@/components/concerts/ConcertRail";
import styles from "@/components/concerts/ConcertSection.module.css";
import { isUpcoming } from "@/lib/concerts";

type Props = {
  concerts: RailConcert[];
  allEventsUrl: string;
  meta: string;
  title: string;
  subtitle: string;
};

/**
 * Bölüm, tarayıcıda şu anki zamana göre yeniden süzülür: sayfa statik/ISR üretildikten sonra
 * tarihi geçen bir konser kalırsa gizlenir (sıradaki konser otomatik bir sonrakine geçer);
 * hiç konser kalmazsa bölümün tamamı kaybolur (boş/eski veri göstermez).
 */
export function ConcertCalendar({ concerts, allEventsUrl, meta, title, subtitle }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const visible = now === null ? concerts : concerts.filter((c) => isUpcoming(c, now));
  if (!visible.length) return null;

  const [next, ...rest] = visible;

  return (
    <section id="takvim" className={`section-shell ${styles.section}`} aria-label="Konser takvimi">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={`display ${styles.ghost}`}>TAKVİM</span>
      </div>

      <div className={`section-content ${styles.content}`}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <p className="meta-label">{meta}</p>
            <h2 className={`display ${styles.title}`}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <a href={allEventsUrl} target="_blank" rel="noopener noreferrer" className={`editorial-link ${styles.all}`}>
            TÜM ETKİNLİKLER ↗
          </a>
        </div>

        <ConcertFeatured key={next.id} concert={next} />

        {rest.length ? <ConcertRail concerts={rest} allEventsUrl={allEventsUrl} /> : null}
      </div>
    </section>
  );
}
