import { ConcertCalendar } from "@/components/concerts/ConcertCalendar";
import type { RailConcert } from "@/components/concerts/ConcertRail";
import { concerts } from "@/data/concerts";
import { siteConfig } from "@/data/site";
import { splitLineup, upcomingConcerts } from "@/lib/concerts";
import { getSiteUrl } from "@/lib/site-url";

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

/** Yaklaşan konser yoksa hiçbir şey çizmez (boş bölüm yok). */
export function ConcertSection() {
  const upcoming = upcomingConcerts(concerts, Date.now());
  if (!upcoming.length) return null;

  const railItems: RailConcert[] = upcoming.map((c) => {
    const start = trParts(c.startsAt);
    return {
      id: c.id,
      title: c.title,
      lineup: splitLineup(c.title),
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
    name: c.title,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ConcertCalendar
        concerts={railItems}
        allEventsUrl={siteConfig.tickets.url}
        meta={siteConfig.calendar.meta}
        title={siteConfig.calendar.title}
        subtitle={siteConfig.calendar.subtitle}
      />
    </>
  );
}
