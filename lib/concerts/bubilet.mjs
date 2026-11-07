/**
 * Bubilet'ten Şehinşah'ın yaklaşan etkinliklerini okur (saf modül: hem Vercel cron rotası
 * hem scripts/sync-concerts.mjs kullanır).
 *
 * Sanatçı sayfası yalnızca bir bölümünü listeler: şehir konserleri (/<şehir>/etkinlik/sehinsah-konseri-)
 * orada görünmeyebilir. Bu yüzden ikisi birleştirilir: sanatçı sayfası (çok sanatçılı geceler, festivaller)
 * + sitemap.xml'de adında "sehinsah" geçen tüm etkinlik sayfaları. Yeni şehirler otomatik bulunur.
 *
 * Güvenlik kuralları (siteye eski/yanlış veri girmesin):
 * - Sanatçı sayfasındaki bağlantı sayısı, Bubilet'in "N seans listeleniyor" bilgisiyle tutmazsa
 *   StructureChanged fırlatır (yapı değişti / sayfalama var): hiçbir şey yazılmamalı.
 * - Bubilet'e ulaşılamazsa (ağ/403/5xx) Unreachable fırlatır; çağıran mevcut veriyi korur.
 * - Tek bir etkinlik sayfası okunamazsa o etkinliğin önceki kaydı korunur (yoksa atlanır).
 * - Etkinlik sayfası okunamazsa o etkinliğin önceki seansları korunur.
 * - Yalnızca robots.txt'in izin verdiği sayfalar (sitemap, /sanatci, /etkinlik) okunur; bekleme payıyla.
 */

export class Unreachable extends Error {}
export class StructureChanged extends Error {}

export const DEFAULT_BASE = "https://www.bubilet.com.tr";
export const GRACE_MS = 6 * 60 * 60 * 1000;
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; SehinsahSiteBot/1.0; +https://github.com/R0YC0LD/sehinsah-dijital-evren)",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "tr-TR,tr;q=0.9",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  let res;
  try {
    res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
  } catch (error) {
    throw new Unreachable(`${url}: ${error.message}`);
  }
  if (!res.ok) throw new Unreachable(`${url}: HTTP ${res.status}`);
  return res.text();
}

/** UTC ISO → "2026-12-18T22:00:00+03:00" (Türkiye saati, DST yok). */
function toTurkeyIso(utcIso) {
  const shifted = new Date(new Date(utcIso).getTime() + TR_OFFSET_MS);
  return `${shifted.toISOString().slice(0, 19)}+03:00`;
}

/** RSC verisindeki ("\"anahtar\":\"değer\"") alanları okur. */
function readFields(html) {
  // Next RSC verisi script parçalarına bölünür; alan adının ortasından bölünebildiği için birleştirilir.
  const t = html.replace(/"\]\)<\/script><script>self\.__next_f\.push\(\[1,"/g, "").replace(/\\"/g, '"');
  const start = t.indexOf('"initialSession":{');
  if (start < 0) return null;
  const end = t.indexOf('"sessionTickets"', start);
  const slice = t.slice(start, end > start ? end : start + 4000);

  const str = (key) => {
    const m = slice.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`));
    if (!m) return null;
    try {
      return JSON.parse(`"${m[1]}"`);
    } catch {
      return m[1];
    }
  };
  const bool = (key) => {
    const m = slice.match(new RegExp(`"${key}":(true|false)`));
    return m ? m[1] === "true" : null;
  };
  const num = (key) => {
    const m = slice.match(new RegExp(`"${key}":(\\d+)`));
    return m ? Number(m[1]) : null;
  };

  const doors = t.match(/Kapı açılışı\s*(\d{1,2}:\d{2})/);
  return {
    eventName: str("eventName"),
    eventDate: str("eventDate"),
    venueName: str("venueName"),
    cityName: str("cityName"),
    active: bool("isSessionActive"),
    soldOut: bool("isMarkedSoldOut"),
    ageLimit: num("ageLimit"),
    doors: doors ? doors[1].padStart(5, "0") : null,
  };
}

async function readEvent(base, href) {
  const html = await getHtml(`${base}${href}`);
  const f = readFields(html);
  if (!f || !f.eventName || !f.eventDate || !f.venueName || !f.cityName) {
    throw new StructureChanged(`Etkinlik sayfası okunamadı: ${href}`);
  }
  if (Number.isNaN(new Date(f.eventDate).getTime())) {
    throw new StructureChanged(`Geçersiz tarih (${f.eventDate}): ${href}`);
  }

  const startsAt = toTurkeyIso(f.eventDate);
  const concert = {
    id: `bubilet-${href.match(/seans\/(\d+)/)[1]}`,
    title: f.eventName.replace(/\s+/g, " ").trim(),
    startsAt,
    city: f.cityName.trim(),
    venue: f.venueName.trim(),
    ticketUrl: `${base}${href}`,
    soldOut: f.soldOut === true,
    active: f.active !== false,
  };
  if (f.doors) concert.doorsAt = `${startsAt.slice(0, 10)}T${f.doors}:00+03:00`;
  if (f.ageLimit) concert.ageLimit = `${f.ageLimit}+`;
  return concert;
}

/** sitemap.xml'de adında "sehinsah" geçen etkinlik sayfaları. */
async function sitemapEventPaths(base) {
  const xml = await getHtml(`${base}/sitemap.xml`);
  return [
    ...new Set(
      [...xml.matchAll(/<loc>[^<]*?(\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]*sehinsah[a-z0-9-]*)<\/loc>/g)].map((m) => m[1]),
    ),
  ];
}

/**
 * @param {{ base?: string, previous?: Array<{id: string}>, now?: number, gapMs?: number, artistPath?: string }} [options]
 * @returns {Promise<{ concerts: any[], sessions: number }>} yaklaşan etkinlikler (tarihe göre sıralı)
 */
export async function fetchBubiletConcerts(options = {}) {
  const {
    base = DEFAULT_BASE,
    previous = [],
    now = Date.now(),
    gapMs = 250,
    artistPath = "/sanatci/sehinsah",
  } = options;
  const prevById = new Map(previous.map((c) => [c.id, c]));

  const artistHtml = await getHtml(`${base}${artistPath}`);
  const artistHrefs = [
    ...new Set(
      [...artistHtml.matchAll(/href="(\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+\/seans\/\d+)"/g)].map((m) => m[1]),
    ),
  ];

  const declared = artistHtml
    .replace(/\\"/g, '"')
    .match(/şu an\s+(\d+)\s+etkinlik\s+ve\s+(\d+)\s+seans\s+listeleniyor/i);
  if (!declared) {
    throw new StructureChanged(
      'Sanatçı sayfasında "N seans listeleniyor" bilgisi bulunamadı — sayfa yapısı değişmiş olabilir.',
    );
  }
  const declaredSessions = Number(declared[2]);
  if (declaredSessions !== artistHrefs.length) {
    throw new StructureChanged(
      `Bubilet ${declaredSessions} seans diyor, sayfada ${artistHrefs.length} bağlantı bulundu — okuma doğrulanamadı.`,
    );
  }

  const found = [];
  const hrefSet = new Set(artistHrefs);
  for (const eventPath of await sitemapEventPaths(base)) {
    try {
      const html = await getHtml(`${base}${eventPath}`);
      for (const m of html.matchAll(/\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+\/seans\/\d+/g)) {
        if (m[0].startsWith(`${eventPath}/seans/`)) hrefSet.add(m[0]);
      }
    } catch (error) {
      if (!(error instanceof Unreachable)) throw error;
      found.push(
        ...previous
          .filter((c) => c.ticketUrl?.startsWith(`${base}${eventPath}/seans/`))
          .map((c) => ({ ...c, active: true })),
      );
    }
    if (gapMs) await sleep(gapMs);
  }
  const hrefs = [...hrefSet];

  for (const href of hrefs) {
    const id = `bubilet-${href.match(/seans\/(\d+)/)[1]}`;
    try {
      found.push(await readEvent(base, href));
    } catch (error) {
      if (error instanceof Unreachable && prevById.has(id)) {
        found.push({ ...prevById.get(id), active: true });
      } else if (!(error instanceof Unreachable)) {
        throw error;
      }
    }
    if (gapMs) await sleep(gapMs);
  }

  const unique = [...new Map(found.map((c) => [c.id, c])).values()];
  const concerts = unique
    .filter((c) => c.active && new Date(c.startsAt).getTime() + GRACE_MS > now)
    .map(({ active, ...rest }) => rest)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return { concerts, sessions: hrefs.length };
}
