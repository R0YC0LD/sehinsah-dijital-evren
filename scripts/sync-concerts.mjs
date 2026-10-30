/**
 * Şehinşah'ın Bubilet sayfasındaki güncel konserleri data/generated/concerts.json'a yazar.
 * Konser takvimi bu dosyadan beslenir; yeni etkinlik eklenir, tarihi geçen veya Bubilet'ten
 * kalkan etkinlik silinir.
 *
 *   node scripts/sync-concerts.mjs
 *
 * Güvenlik kuralları (siteye eski/yanlış veri girmesin):
 * - Sayfadaki bağlantı sayısı, Bubilet'in "N seans listeleniyor" bilgisiyle tutmazsa
 *   (yapı değişti / sayfalama var) HİÇBİR ŞEY yazılmaz ve çalışma hata ile biter.
 * - Bubilet'e ulaşılamazsa (ağ/403/5xx) mevcut veri korunur ve çıkış kodu 2 olur (Action kırmızı olur,
 *   sessizce eskimesin); tarihi geçenler sitede zaten çalışma anında gizlenir.
 * - Tek etkinlik sayfası okunamazsa o etkinliğin önceki kaydı korunur (yoksa atlanır).
 * - Yalnızca robots.txt'in izin verdiği sayfalar (/sanatci, /etkinlik) okunur; az istek, bekleme payıyla.
 *
 * Değişiklik varsa GITHUB_OUTPUT'a `changed=true` ve `summary=...` yazar.
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "generated", "concerts.json");
const BASE = process.env.BUBILET_BASE || "https://www.bubilet.com.tr";
const ARTIST_PAGE = `${BASE}/sanatci/sehinsah`;
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; SehinsahSiteBot/1.0; +https://github.com/R0YC0LD/sehinsah-dijital-evren)",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "tr-TR,tr;q=0.9",
};
const GRACE_MS = 6 * 60 * 60 * 1000;
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;
const GAP_MS = 600;

class Unreachable extends Error {}
class StructureChanged extends Error {}

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
  const t = html.replace(/\\"/g, '"');
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

async function readEvent(href) {
  const html = await getHtml(`${BASE}${href}`);
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
    ticketUrl: `${BASE}${href}`,
    soldOut: f.soldOut === true,
    active: f.active !== false,
  };
  if (f.doors) concert.doorsAt = `${startsAt.slice(0, 10)}T${f.doors}:00+03:00`;
  if (f.ageLimit) concert.ageLimit = `${f.ageLimit}+`;
  return concert;
}

async function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/\r?\n/g, " ")}\n`);
  }
}

const stable = (list) => JSON.stringify(list);

async function main() {
  let previous = { schemaVersion: 1, source: "bubilet", updatedAt: null, concerts: [] };
  try {
    previous = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* ilk çalışma */
  }
  const prevById = new Map(previous.concerts.map((c) => [c.id, c]));

  const artistHtml = await getHtml(ARTIST_PAGE);
  const hrefs = [
    ...new Set(
      [...artistHtml.matchAll(/href="(\/[a-z0-9-]+\/etkinlik\/[a-z0-9-]+\/seans\/\d+)"/g)].map((m) => m[1]),
    ),
  ];

  const declared = artistHtml.replace(/\\"/g, '"').match(/şu an\s+(\d+)\s+etkinlik\s+ve\s+(\d+)\s+seans\s+listeleniyor/i);
  if (!declared) {
    throw new StructureChanged(
      'Sanatçı sayfasında "N seans listeleniyor" bilgisi bulunamadı — sayfa yapısı değişmiş olabilir.',
    );
  }
  const declaredSessions = Number(declared[2]);
  if (declaredSessions !== hrefs.length) {
    throw new StructureChanged(
      `Bubilet ${declaredSessions} seans diyor, sayfada ${hrefs.length} bağlantı bulundu — okuma doğrulanamadı.`,
    );
  }
  console.log(`[concerts] Bubilet: ${hrefs.length} seans`);

  const now = Date.now();
  const found = [];
  for (const href of hrefs) {
    const id = `bubilet-${href.match(/seans\/(\d+)/)[1]}`;
    try {
      found.push(await readEvent(href));
    } catch (error) {
      if (error instanceof Unreachable && prevById.has(id)) {
        console.warn(`[concerts] ${href} okunamadı, önceki kayıt korunuyor (${error.message})`);
        found.push({ ...prevById.get(id), active: true });
      } else if (error instanceof Unreachable) {
        console.warn(`[concerts] ${href} okunamadı, atlandı (${error.message})`);
      } else {
        throw error;
      }
    }
    await sleep(GAP_MS);
  }

  const concerts = found
    .filter((c) => c.active && new Date(c.startsAt).getTime() + GRACE_MS > now)
    .map(({ active, ...rest }) => rest)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const changed = stable(concerts) !== stable(previous.concerts);
  if (changed) {
    const out = { schemaVersion: 1, source: "bubilet", updatedAt: new Date().toISOString(), concerts };
    await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  }

  const addedIds = concerts.filter((c) => !prevById.has(c.id)).map((c) => `${c.title} (${c.startsAt.slice(0, 10)})`);
  const removed = previous.concerts.filter((c) => !concerts.some((n) => n.id === c.id)).length;
  console.log(
    `[concerts] ${concerts.length} yaklaşan konser — ${changed ? `güncellendi (+${addedIds.length} / −${removed})` : "değişiklik yok"}`,
  );
  await setOutput("changed", String(changed));
  if (changed) await setOutput("summary", `konser takvimi: +${addedIds.length} / −${removed}`);
}

main().catch(async (error) => {
  if (error instanceof Unreachable) {
    console.warn(`[concerts] Bubilet'e ulaşılamadı: ${error.message} — mevcut veri korunuyor.`);
    await setOutput("changed", "false");
    process.exit(2);
  }
  console.error("[concerts] HATA:", error.message || error);
  await setOutput("changed", "false");
  process.exit(1);
});
