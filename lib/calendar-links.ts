/** Konseri kullanıcının takvimine ekleme / yol tarifi bağlantıları (sunucu gerektirmez). */

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  city: string;
  venue: string;
  ticketUrl: string;
};

/** Bitiş saati bilinmiyor; takvim girdisi için makul bir süre varsayılır. */
const ASSUMED_DURATION_MS = 3 * 60 * 60 * 1000;

const utcStamp = (ms: number) =>
  new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

function range(event: CalendarEvent) {
  const start = new Date(event.startsAt).getTime();
  return { start: utcStamp(start), end: utcStamp(start + ASSUMED_DURATION_MS) };
}

/** Mekan adı şehri zaten içeriyorsa ("... Hall Ankara") tekrar etme. */
const place = (event: CalendarEvent) =>
  event.venue.toLocaleLowerCase("tr").includes(event.city.toLocaleLowerCase("tr"))
    ? event.venue
    : `${event.venue}, ${event.city}`;
const details = (event: CalendarEvent) => `Bilet: ${event.ticketUrl}`;

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = range(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: place(event),
    details: details(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({ api: "1", query: place(event).replace(", ", " ") });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

const escapeIcs = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/** RFC 5545 .ics içeriği (Apple/Outlook/Google hepsi açar). */
export function icsContent(event: CalendarEvent, now: number = Date.now()): string {
  const { start, end } = range(event);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sehinsah//Konser Takvimi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@sehinsah`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(place(event))}`,
    `DESCRIPTION:${escapeIcs(details(event))}`,
    `URL:${event.ticketUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(event: CalendarEvent): void {
  const blob = new Blob([icsContent(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sehinsah-${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
