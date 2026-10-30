"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ConcertRail.module.css";

export type RailConcert = {
  id: string;
  title: string;
  lineup: string[];
  startsAt: string;
  day: string;
  month: string;
  year: string;
  weekday: string;
  time: string;
  doors: string | null;
  city: string;
  venue: string;
  ticketUrl: string;
  ageLimit: string | null;
  soldOut: boolean;
};

type Props = {
  concerts: RailConcert[];
  allEventsUrl: string;
  emptyMessage: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function countdownLabel(startsAt: string, now: number): string | null {
  const diff = new Date(startsAt).getTime() - now;
  if (diff <= 0) return "BUGÜN";
  const days = Math.ceil(diff / DAY_MS);
  return days === 1 ? "YARIN" : `${days} GÜN KALDI`;
}

export function ConcertRail({ concerts, allEventsUrl, emptyMessage }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });
  const [now, setNow] = useState<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = railRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges, concerts.length]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const step = (card?.offsetWidth ?? el.clientWidth * 0.8) + 16;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Dokunmatik ekran zaten doğal kayar; sürükleme sadece fare için.
    if (e.pointerType !== "mouse" || e.button !== 0 || !railRef.current) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: railRef.current.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = railRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      el.dataset.dragging = "true";
    }
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  };

  const endDrag = () => {
    const el = railRef.current;
    drag.current.active = false;
    if (el) delete el.dataset.dragging;
  };

  // Sürükleme sonrası kartın içindeki bağlantıya yanlışlıkla tıklanmasın.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") scrollByCard(1);
    if (e.key === "ArrowLeft") scrollByCard(-1);
  };

  if (!concerts.length) {
    return (
      <div className={`panel ${styles.empty}`}>
        <p className={styles.emptyText}>{emptyMessage}</p>
        <a href={allEventsUrl} target="_blank" rel="noopener noreferrer" className={`editorial-link ${styles.emptyLink}`}>
          BUBİLET’TE TAKİP ET ↗
        </a>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <p className={styles.hint} aria-hidden="true">
          <span>KAYDIR</span>
          <span className={styles.hintLine} />
          <span>→</span>
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label="Önceki etkinlik"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Sonraki etkinlik"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className={styles.rail}
        role="region"
        aria-label="Yaklaşan etkinlikler"
        tabIndex={0}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {concerts.map((c) => {
          const countdown = now ? countdownLabel(c.startsAt, now) : null;
          return (
            <article key={c.id} className={styles.card} data-rail-card>
              <div className={styles.dateBlock}>
                <span className={`display ${styles.day}`}>{c.day}</span>
                <span className={styles.month}>
                  {c.month} {c.year}
                </span>
                <span className={styles.weekday}>{c.weekday}</span>
              </div>

              <div className={styles.body}>
                <div className={styles.badges}>
                  {c.soldOut ? (
                    <span className={styles.soldOut}>TÜKENDİ</span>
                  ) : (
                    <span className={styles.onSale}>BİLETLER SATIŞTA</span>
                  )}
                  {countdown ? <span className={styles.countdown}>{countdown}</span> : null}
                </div>

                <h3 className={`display ${styles.cardTitle}`}>{c.title}</h3>
                {c.lineup.length ? <p className={styles.lineup}>{c.lineup.join(" · ")}</p> : null}

                <dl className={styles.meta}>
                  <div>
                    <dt>YER</dt>
                    <dd>
                      {c.venue}
                      <span className={styles.city}>{c.city}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>SAAT</dt>
                    <dd>
                      {c.time}
                      {c.doors ? <span className={styles.city}>Kapı {c.doors}</span> : null}
                    </dd>
                  </div>
                  {c.ageLimit ? (
                    <div>
                      <dt>YAŞ</dt>
                      <dd>{c.ageLimit}</dd>
                    </div>
                  ) : null}
                </dl>

                <a
                  href={c.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cta}
                  draggable={false}
                >
                  {c.soldOut ? "BUBİLET’TE GÖR ↗" : "BİLET AL ↗"}
                </a>
              </div>
            </article>
          );
        })}

        <a
          className={`${styles.card} ${styles.more}`}
          href={allEventsUrl}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
        >
          <span className={`display ${styles.moreTitle}`}>TÜM ETKİNLİKLER</span>
          <span className={styles.moreArrow} aria-hidden="true">
            ↗
          </span>
          <span className={styles.moreSub}>Bubilet’te güncel liste</span>
        </a>
      </div>
    </div>
  );
}
