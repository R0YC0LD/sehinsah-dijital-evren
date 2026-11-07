/**
 * Bubilet'ten Şehinşah'ın yaklaşan etkinliklerini okur (saf modül: hem Vercel cron rotası
 * hem scripts/sync-concerts.mjs kullanır).
 *
 * Etkinlikler üç yoldan bulunur, biri kaçırsa diğeri yakalar:
 *  1) Sanatçı sayfası (çok sanatçılı geceler, festivaller; şehir konserlerinin çoğu burada görünmez).
 *  2) sitemap.xml'de adında "sehinsah" geçen tüm etkinlik sayfaları.
 *  3) 81 il + sitemap'teki tüm şehirler için /<şehir>/etkinlik/sehinsah-konseri- sayfası taranır.
 *     Bubilet bu sayfayı her şehir için açar: konser o şehirdeyse yalnızca oradaki seansı, değilse
 *     tüm şehirlerin seanslarını o şehrin adresiyle listeler. Bu yüzden seanslar ID ile tekilleştirilir,
 *     bilet bağlantısı konserin gerçek şehrine çevrilir.
 *
 * Güvenlik kuralları (siteye eski/yanlış veri girmesin):
 * - Geçici hatalar (ağ, 429, 5xx) beklemeli olarak yeniden denenir.
 * - Bir kaynak okunamazsa (complete: false) önceki kayıtlar silinmez; konser ancak tam bir taramada
 *   bulunamazsa ya da Bubilet'te 404 ise kalkar.
 * - Tek bir etkinlik/seans okunamazsa önceki kaydı korunur; seansların yarısından çoğu
 *   ayrıştırılamazsa StructureChanged fırlatılır, hiçbir şey yazılmaz.
 * - Sanatçı sayfasından gelmeyen etkinliğin adında Şehinşah geçmek zorundadır.
 * - Yalnızca robots.txt'in izin verdiği sayfalar okunur.
 */

export class Unreachable extends Error {}
export class StructureChanged extends Error {}
class NotFound extends Error {}

export const DEFAULT_BASE = "https://www.bubilet.com.tr";
export const GRACE_MS = 6 * 60 * 60 * 1000;
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

const EVENT_SLUG = "sehinsah-konseri-";
const TR_CITIES = `adana adiyaman afyonkarahisar agri aksaray amasya ankara antalya ardahan artvin aydin balikesir
  bartin batman bayburt bilecik bingol bitlis bolu burdur bursa canakkale cankiri corum denizli diyarbakir duzce
  edirne elazig erzincan erzurum eskisehir gaziantep giresun gumushane hakkari hatay igdir isparta istanbul izmir
  kahramanmaras karabuk karaman kars kastamonu kayseri kibris kilis kirikkale kirklareli kirsehir kocaeli konya
  kutahya malatya manisa mardin mersin mugla mus nevsehir nigde ordu osmaniye rize sakarya samsun sanliurfa siirt
  sinop sirnak sivas tekirdag tokat trabzon tunceli usak van yalova yozgat zonguldak`.split(/\s+/);

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; SehinsahSiteBot/1.0; +https://github.com/R0YC0LD/sehinsah-dijital-evren)",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "tr-TR,tr;q=0.9",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url, attempts = 3) {
  let failure = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
      if (res.ok) return await res.text();
      if (res.status === 404) throw new NotFound(url);
      failure = `HTTP ${res.status}`;
    } catch (error) {
      if (error instanceof NotFound) throw error;
      failure = error.message;
    }
    if (attempt < attempts) await sleep(attempt * 1000);
  }
  throw new Unreachable(`${url}: ${failure}`);
}

/** Aynı anda en fazla `size` iş. */
async function pool(items, size, work) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await work(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
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

const TR_LETTERS = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
const citySlug = (name) =>
  name.trim().toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (c) => TR_LETTERS[c]).replace(/[^a-z0-9]+/g, "-");

async function readEvent(base, href, citySlugs) {
  const html = await getHtml(`${base}${href}`);
  const f = readFields(html);
  if (!f || !f.eventName || !f.eventDate || !f.venueName || !f.cityName) {
    throw new StructureChanged(`Etkinlik sayfası okunamadı: ${href}`);
  }
  if (Number.isNaN(new Date(f.eventDate).getTime())) {
    throw new StructureChanged(`Geçersiz tarih (${f.eventDate}): ${href}`);
  }

  const startsAt = toTurkeyIso(f.eventDate);
  const slug = citySlug(f.cityName);
  const concert = {
    id: `bubilet-${href.match(/seans\/(\d+)/)[1]}`,
    title: f.eventName.replace(/\s+/g, " ").trim(),
    startsAt,
    city: f.cityName.trim(),
    venue: f.venueName.trim(),
    ticketUrl: `${base}${citySlugs.has(slug) ? href.replace(/^\/[a-z0-9-]+/, `/${slug}`) : href}`,
    soldOut: f.soldOut === true,
    active: f.active !== false,
  };
  if (f.doors) concert.doorsAt = `${startsAt.slice(0, 10)}T${f.doors}:00+03:00`;
  if (f.ageLimit) concert.ageLimit = `${f.ageLimit}+`;
  return concert;
}

/** sitemap.xml'den Şehinşah etkinlik sayfaları ve Bubilet'in etkinlik listelediği tüm şehirler. */
async function readSitemap(base) {
  const xml = await getHtml(`${base}/sitemap.xml`);
  const eventPaths = new Set();
  const cities = new Set();
  for (const m of xml.matchAll(/<loc>[^<]*?(\/([a-z0-9-]+)\/etkinlik\/([a-z0-9-]+))<\/loc>/g)) {
    cities.add(m[2]);
    if (m[3].includes("sehinsah")) eventPaths.add(m[1]);
  }
  return { eventPaths: [...eventPaths], cities: [...cities] };
}

const SESSION_HREF = /\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+\/seans\/\d+/g;
const sessionId = (href) => `bubilet-${href.match(/seans\/(\d+)/)[1]}`;

/**
 * @param {{ base?: string, previous?: Array<{id: string, ticketUrl: string}>, now?: number, artistPath?: string, budgetMs?: number }} [options]
 * @returns {Promise<{ concerts: any[], sessions: number, complete: boolean, warnings: string[] }>}
 */
export async function fetchBubiletConcerts(options = {}) {
  const {
    base = DEFAULT_BASE,
    previous = [],
    now = Date.now(),
    artistPath = "/sanatci/sehinsah",
    budgetMs = 45000,
  } = options;
  const startedAt = Date.now();
  const timeLeft = () => budgetMs - (Date.now() - startedAt);
  const prevById = new Map(previous.map((c) => [c.id, c]));
  const warnings = [];
  let complete = true;

  const artistHrefs = new Set();
  let artistFailed = false;
  try {
    const html = await getHtml(`${base}${artistPath}`);
    for (const m of html.matchAll(/href="(\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+\/seans\/\d+)"/g)) artistHrefs.add(m[1]);
    const declared = html.replace(/\\"/g, '"').match(/şu an\s+(\d+)\s+etkinlik\s+ve\s+(\d+)\s+seans\s+listeleniyor/i);
    if (!declared || Number(declared[2]) !== artistHrefs.size) {
      warnings.push(`Sanatçı sayfası: ${declared?.[2] ?? "?"} seans yazıyor, ${artistHrefs.size} bağlantı okundu`);
      complete = false;
    }
  } catch (error) {
    artistFailed = true;
    complete = false;
    warnings.push(`Sanatçı sayfası okunamadı: ${error.message}`);
  }

  let sitemap = { eventPaths: [], cities: [] };
  try {
    sitemap = await readSitemap(base);
  } catch (error) {
    if (artistFailed) throw error instanceof Unreachable ? error : new Unreachable(error.message);
    complete = false;
    warnings.push(`Sitemap okunamadı: ${error.message}`);
  }

  const knownPaths = new Set(sitemap.eventPaths);
  for (const c of previous) {
    const m = c.ticketUrl?.match(/(\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+)\/seans\//);
    if (m && m[1].includes("sehinsah")) knownPaths.add(m[1]);
  }

  const found = [];
  const artistIds = new Set([...artistHrefs].map(sessionId));
  const hrefs = new Map([...artistHrefs].map((href) => [sessionId(href), href]));
  const citySlugs = new Set([...TR_CITIES, ...sitemap.cities]);
  const readEventPage = async (eventPath) => {
    const html = await getHtml(`${base}${eventPath}`, 2);
    for (const [href] of html.matchAll(SESSION_HREF)) {
      if (href.startsWith(`${eventPath}/seans/`) && !hrefs.has(sessionId(href))) hrefs.set(sessionId(href), href);
    }
  };
  const keepPrevious = (test) =>
    found.push(...previous.filter(test).map((c) => ({ ...c, active: true })));

  await pool([...knownPaths], 4, async (eventPath) => {
    try {
      await readEventPage(eventPath);
    } catch (error) {
      if (error instanceof NotFound) return;
      complete = false;
      warnings.push(`Etkinlik okunamadı: ${eventPath}`);
      keepPrevious((c) => c.ticketUrl?.startsWith(`${base}${eventPath}/seans/`));
    }
  });

  const probes = [...new Set([...TR_CITIES, ...sitemap.cities])]
    .map((city) => `/${city}/etkinlik/${EVENT_SLUG}`)
    .filter((eventPath) => !knownPaths.has(eventPath));
  let skippedProbes = 0;
  await pool(probes, 6, async (eventPath) => {
    if (timeLeft() < 22000) {
      skippedProbes += 1;
      return;
    }
    await readEventPage(eventPath).catch(() => {});
  });
  if (skippedProbes) warnings.push(`Süre yetmedi, ${skippedProbes} şehir sayfası taranamadı`);

  let unreadable = 0;
  await pool([...hrefs], 4, async ([id, href]) => {
    const keep = () => {
      complete = false;
      if (prevById.has(id)) found.push({ ...prevById.get(id), active: true });
    };
    if (timeLeft() < 3000) return keep();
    try {
      const concert = await readEvent(base, href, citySlugs);
      if (!artistIds.has(id) && !concert.title.toLocaleLowerCase("tr").includes("şehinşah")) {
        warnings.push(`Şehinşah etkinliği değil, atlandı: ${concert.title}`);
        return;
      }
      found.push(concert);
    } catch (error) {
      if (error instanceof NotFound) return;
      if (error instanceof StructureChanged) {
        unreadable += 1;
        warnings.push(error.message);
      }
      keep();
    }
  });
  if (unreadable > Math.max(1, hrefs.size / 2)) {
    throw new StructureChanged(`${hrefs.size} seansın ${unreadable} tanesi ayrıştırılamadı: sayfa yapısı değişmiş olabilir.`);
  }

  if (!complete) keepPrevious((c) => !found.some((f) => f.id === c.id));

  const unique = [...new Map(found.map((c) => [c.id, c])).values()];
  const concerts = unique
    .filter((c) => c.active && new Date(c.startsAt).getTime() + GRACE_MS > now)
    .map(({ active, ...rest }) => rest)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return { concerts, sessions: hrefs.size, complete, warnings };
}
