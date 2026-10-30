/**
 * Şehinşah'ın resmî YouTube kanalındaki videoları data/generated/youtube-videos.json'a yazar.
 * Parça sayfaları klipleri bu listeden, başlık eşleşmesiyle bulur (lib/youtube/match.ts).
 *
 *   node scripts/sync-youtube.mjs          # RSS: son ~15 video (anahtarsız, kararlı) — otomatik senkron bunu kullanır
 *   node scripts/sync-youtube.mjs --deep   # + yükleme listesinin ilk 100 videosu (HTML okuma, elle/ara sıra)
 *
 * Sadece ekler/günceller; mevcut kayıtları silmez. API anahtarı gerekmez.
 * Değişiklik varsa GITHUB_OUTPUT'a `changed=true` yazar.
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "generated", "youtube-videos.json");
const CHANNEL_ID = "UC5kvrlBkq31r5e36YP9UO6g"; // @SEHINSAHIKARUS
const UPLOADS = `UU${CHANNEL_ID.slice(2)}`;
const DEEP = process.argv.includes("--deep");
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  "accept-language": "tr-TR,tr;q=0.9",
  cookie: "CONSENT=YES+1; SOCS=CAI",
};

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

async function fromRss() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`rss_${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const m of xml.matchAll(
    /<entry>[\s\S]*?<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<title>([^<]*)<\/title>[\s\S]*?<published>([^<]*)<\/published>/g,
  )) {
    out.push({ id: m[1], title: decode(m[2]).trim(), published: m[3].slice(0, 10) });
  }
  return out;
}

async function fromUploadsPage() {
  const res = await fetch(`https://www.youtube.com/playlist?list=${UPLOADS}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`playlist_${res.status}`);
  const html = await res.text();
  const i = html.indexOf("ytInitialData");
  const start = html.indexOf("{", i);
  const end = html.indexOf(";</script>", start);
  const data = JSON.parse(html.slice(start, end));
  const seen = new Map();
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (typeof o.videoId === "string" && o.videoId.length === 11) {
      const title =
        o.title?.runs?.[0]?.text ||
        o.title?.simpleText ||
        o.headline?.runs?.[0]?.text ||
        o.headline?.simpleText;
      if (title && !seen.has(o.videoId)) seen.set(o.videoId, title);
    }
    const lockupTitle = o.metadata?.lockupMetadataViewModel?.title?.content;
    if (o.contentId && lockupTitle && !seen.has(o.contentId)) seen.set(o.contentId, lockupTitle);
    for (const k in o) walk(o[k]);
  })(data);
  return [...seen].map(([id, title]) => ({ id, title: title.trim() }));
}

async function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main() {
  let existing = { channelId: CHANNEL_ID, updatedAt: null, videos: [] };
  try {
    existing = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* ilk çalışma */
  }

  const byId = new Map(existing.videos.map((v) => [v.id, v]));
  const before = JSON.stringify([...byId.values()]);

  const incoming = [];
  if (DEEP) {
    const deep = await fromUploadsPage().catch((e) => {
      console.warn("[sync-youtube] deep:", e.message);
      return [];
    });
    console.log("[sync-youtube] deep videos:", deep.length);
    incoming.push(...deep);
  }
  incoming.push(...(await fromRss()));

  for (const v of incoming) {
    const prev = byId.get(v.id);
    byId.set(v.id, { ...prev, ...v });
  }

  const videos = [...byId.values()];
  const changed = JSON.stringify(videos) !== before;
  console.log(`[sync-youtube] ${videos.length} video (${changed ? "güncellendi" : "değişiklik yok"})`);

  if (changed) {
    await writeFile(
      OUT,
      `${JSON.stringify({ channelId: CHANNEL_ID, updatedAt: new Date().toISOString(), videos }, null, 2)}\n`,
      "utf8",
    );
  }
  await setOutput("changed", String(changed));
}

main().catch(async (error) => {
  console.error("[sync-youtube] HATA:", error.message || error);
  await setOutput("changed", "false");
  process.exit(1);
});
