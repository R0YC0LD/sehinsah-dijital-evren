/**
 * Spotify parça/albüm adı ↔ resmî YouTube kanalı video eşleştirme çekirdeği.
 * Saf fonksiyonlar (Next'e bağımlı değil): hem site (lib/youtube/match.ts) hem de
 * denetim script'i (scripts/audit-videos.mjs) bunu kullanır.
 *
 * Amaç: yanlış/alakasız videonun otomatik oynamasını ENGELLEMEK. Ad eşleşmesi tek başına
 * yetmez; eşleşen videonun SÜRESİ parçanın süresine, YAYIN TARİHİ sürümün tarihine uymalıdır.
 * Doğrulanamayan eşleşme kabul edilmez (klipsiz kalmak yanlış klipten iyidir).
 */

/** Türkçe karakterleri sadeleştirip yalnızca harf/rakam bırakır: "70'lik" → "70lik". */
export function normalizeTitle(value) {
  return String(value)
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

const SKIP_TITLE = /(live|canlı|vlog|documentary|belgesel|prova|konser|tour|duyuru|shorts)/i;
/** "Şehinşah | X", "Şehinşah ft. Hidra - X", "Şehinşah & Archie | X" önekleri. */
const LEAD_ARTIST = /^(şehinşah|sehinsah)(\s*(&|ft\.?|feat\.?|x)\s*[^|\-–:]+)?\s*[|\-–:]\s*/i;
/** "Başka Sanatçı feat. Şehinşah - X" */
const GUEST_ARTIST = /^.+?\s+(?:ft\.?|feat\.?)\s+(?:şehinşah|sehinsah)\s*[|\-–:]\s*/i;
const TRAILING_FEAT = /\s+(?:ft\.?|feat\.?)\s+.*$/i;

/** Çok genel adlar: ad eşleşmesi yetmez, süre doğrulaması ŞART. */
const GENERIC_NAMES = new Set(
  [
    "intro",
    "outro",
    "skit",
    "interlude",
    "giris",
    "cikis",
    "ara",
    "demo",
    "beat",
    "freestyle",
    "remix",
    "instrumental",
    "akustik",
    "acoustic",
    "prelude",
    "reprise",
    "feat",
    "untitled",
    "isimsiz",
  ].map(normalizeTitle),
);

/** Süre toleransı: en az 15 sn, parça süresinin %12'si. */
export function durationTolerance(trackMs) {
  return Math.max(15_000, trackMs * 0.12);
}
/** Yayın tarihi penceresi (gün): klip sürümden en fazla 60 gün önce/sonra yayınlanmış olmalı. */
export const DATE_WINDOW_DAYS = 60;

/** Video başlığından olası parça adlarını çıkarır; resmî düzen ("Şehinşah | X") rank 2. */
export function titleCandidates(title) {
  if (title.includes("#") || SKIP_TITLE.test(title)) return [];

  let t = title
    .replace(/[([][^)\]]*[)\]]/g, " ")
    .replace(/\b(official\s+)?(lyric\s+)?(video|audio|clip|klip|visualizer)\b/gi, " ")
    .trim();

  let rank = 1;
  if (LEAD_ARTIST.test(t)) {
    t = t.replace(LEAD_ARTIST, "");
    rank = 2;
  } else if (GUEST_ARTIST.test(t)) {
    t = t.replace(GUEST_ARTIST, "");
    rank = 2;
  }
  t = t.replace(TRAILING_FEAT, "").trim();

  const parts = t.split(/\s*\/\s*/).filter(Boolean);
  return [t, ...parts].map((value) => ({ key: normalizeTitle(value), rank }));
}

/** videos: [{ id, title, durationSec?, published? }] → Map<anahtar, aday[]> */
export function buildIndex(videos) {
  const index = new Map();
  for (const video of videos) {
    for (const { key, rank } of titleCandidates(video.title)) {
      if (!key) continue;
      const list = index.get(key) ?? [];
      if (!list.some((c) => c.id === video.id)) {
        list.push({
          id: video.id,
          title: video.title,
          rank,
          durationSec: video.durationSec ?? null,
          published: video.published ?? null,
        });
      }
      index.set(key, list);
    }
  }
  return index;
}

/** Spotify adındaki "(feat. X)", "(with X)", "(prod. X)" eklerini atar; "(Deluxe Edition)" kalır. */
export function cleanName(name) {
  return String(name).replace(/\s*[([]\s*(?:feat|ft|with|prod)\b[^)\]]*[)\]]/gi, "").trim();
}

export function isGenericName(name) {
  const key = normalizeTitle(cleanName(name));
  return key.length < 4 || GENERIC_NAMES.has(key);
}

function checkCandidate(cand, ctx, generic) {
  let duration = "unknown";
  if (cand.durationSec && ctx.durationMs) {
    const diff = Math.abs(cand.durationSec * 1000 - ctx.durationMs);
    duration = diff <= durationTolerance(ctx.durationMs) ? "ok" : "bad";
  }

  let date = "unknown";
  if (cand.published && ctx.releaseDate) {
    const days = (Date.parse(cand.published) - Date.parse(ctx.releaseDate)) / 86_400_000;
    if (Number.isFinite(days)) date = Math.abs(days) <= DATE_WINDOW_DAYS ? "ok" : "bad";
  }

  const anyBad = duration === "bad" || date === "bad";
  const anyOk = duration === "ok" || date === "ok";
  // Genel adlar (Intro, Su, …) yalnızca SÜRE doğrulamasıyla kabul edilir.
  const accepted = !anyBad && anyOk && (!generic || duration === "ok");
  return { accepted, duration, date };
}

/**
 * @param {Map} index buildIndex çıktısı
 * @param {string} name Spotify parça/albüm adı
 * @param {{ durationMs?: number, releaseDate?: string }} ctx doğrulama bağlamı
 * @param {{ ids?: string[], overrides?: Record<string, string|null> }} opts
 * @returns {{ id: string|null, reason: string, title?: string }}
 */
export function matchVideo(index, name, ctx = {}, opts = {}) {
  const { ids = [], overrides = {} } = opts;
  for (const id of ids) {
    if (id in overrides) {
      return overrides[id]
        ? { id: overrides[id], reason: "override" }
        : { id: null, reason: "override:none" };
    }
  }

  const key = normalizeTitle(cleanName(name));
  if (!key) return { id: null, reason: "empty-name" };
  const candidates = index.get(key);
  if (!candidates?.length) return { id: null, reason: "no-title-match" };

  const generic = isGenericName(name);
  const checked = candidates.map((cand) => ({ cand, ...checkCandidate(cand, ctx, generic) }));
  const accepted = checked.filter((c) => c.accepted);
  if (!accepted.length) {
    const why = checked.map((c) => `süre:${c.duration} tarih:${c.date}`).join(" | ");
    return { id: null, reason: `rejected(${why}${generic ? ", genel ad" : ""})`, title: candidates[0].title };
  }

  // Önce resmî düzendeki başlık, sonra süreye en yakın olan.
  accepted.sort((a, b) => {
    if (b.cand.rank !== a.cand.rank) return b.cand.rank - a.cand.rank;
    const da = a.cand.durationSec && ctx.durationMs ? Math.abs(a.cand.durationSec * 1000 - ctx.durationMs) : 0;
    const db = b.cand.durationSec && ctx.durationMs ? Math.abs(b.cand.durationSec * 1000 - ctx.durationMs) : 0;
    return da - db;
  });
  const best = accepted[0];
  return {
    id: best.cand.id,
    reason: `ok(süre:${best.duration} tarih:${best.date})`,
    title: best.cand.title,
  };
}
