import { ConcertRail, type RailConcert } from "@/components/concerts/ConcertRail";
import styles from "@/components/concerts/ConcertSection.module.css";
import { concerts } from "@/data/concerts";
import { siteConfig } from "@/data/site";
import { getSiteUrl } from "@/lib/site-url";

/** Etkinlik başladıktan sonra bu kadar süre daha "yaklaşan" sayılır (gece yarısı sonrası biten konserler). */
const GRACE_MS = 6 * 60 * 60 * 1000;

const WEEKDAYS = ["PAZAR", "PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA", "CUMARTESİ"];
const MONTHS = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];

/** Türkiye saati (UTC+3, DST yok) ile gün/ay/saat — sunucu saat diliminden bağımsız. */
function trParts(iso: string) {
  const shifted = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return {
    day: shifted.getUTCDate(),
    month: MONTHS[shifted.getUTCMonth()],
    year: shifted.getUTCFullYear(),
    weekday: WEEKDAYS[shifted.getUTCDay()],
    time: `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`,
  };
}

export function ConcertSection() {
  const now = Date.now();
  const upcoming = concerts
    .filter((c) => new Date(c.startsAt).getTime() + GRACE_MS > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const railItems: RailConcert[] = upcoming.map((c) => {
    const start = trParts(c.startsAt);
    return {
      id: c.id,
      title: c.title,
      lineup: c.lineup ?? [],
      startsAt: c.startsAt,
      day: String(start.day).padStart(2, "0"),
      month: start.month,
      year: String(start.year),
      weekday: start.weekday,
      time: start.time,
      doors: c.doorsAt ? trParts(c.doorsAt).time : null,
      city: c.city,
      venue: c.venue,
      ticketUrl: c.ticketUrl,
      ageLimit: c.ageLimit ?? null,
      soldOut: Boolean(c.soldOut),
    };
  });

  const jsonLd = upcoming.map((c) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: c.lineup?.length ? `${c.title}: ${c.lineup.join(", ")}` : c.title,
    startDate: c.startsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: c.venue,
      address: { "@type": "PostalAddress", addressLocality: c.city, addressCountry: "TR" },
    },
    performer: { "@type": "MusicGroup", name: siteConfig.displayName, url: getSiteUrl() },
    offers: {
      "@type": "Offer",
      url: c.ticketUrl,
      availability: c.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  }));

  return (
    <section id="takvim" className={`section-shell ${styles.section}`} aria-label="Konser takvimi">
      {jsonLd.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={`display ${styles.ghost}`}>TAKVİM</span>
      </div>

      <div className={`section-content ${styles.content}`}>
        <div className={styles.header}>
          <p className="meta-label">{siteConfig.calendar.meta}</p>
          <h2 className={`display ${styles.title}`}>{siteConfig.calendar.title}</h2>
          <p className={styles.subtitle}>{siteConfig.calendar.subtitle}</p>
        </div>

        <ConcertRail
          concerts={railItems}
          allEventsUrl={siteConfig.tickets.url}
          emptyMessage={siteConfig.calendar.empty}
        />
      </div>
    </section>
  );
}
