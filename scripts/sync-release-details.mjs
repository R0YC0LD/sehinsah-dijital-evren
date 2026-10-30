/**
 * Parça sayfaları için albüm detaylarını (parça listesi, süreler, etiket, telif satırı)
 * data/generated/release-details.json içine yazar. Sayfalar bu dosyadan okur, böylece
 * ziyaretçi başına Spotify API'ye gidilmez (rate limit riski yok, sayfalar statik üretilir).
 *
 *   node --env-file=.env.local scripts/sync-release-details.mjs        # eksik olanlar (en fazla 20)
 *   node --env-file=.env.local scripts/sync-release-details.mjs --all  # hepsini tamamla
 *
 * Sadece eksik sürümleri ekler, mevcutları değiştirmez. İstekler arası 700 ms bekler;
 * Spotify 429 verirse o ana kadarkini kaydedip temiz çıkar.
 * Değişiklik varsa GITHUB_OUTPUT'a `changed=true` yazar.
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const OUT = path.join(ROOT, "data", "generated", "release-details.json");
const MARKET = process.env.SPOTIFY_MARKET || "TR";
const ALL = process.argv.includes("--all");
const CAP = ALL ? Infinity : 20;
const GAP_MS = 700;

class RateLimited extends Error {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET tanımlı değil");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (res.status === 429) throw new RateLimited(`token 429 (retry-after ${res.headers.get("retry-after")})`);
  if (!res.ok) throw new Error(`token_${res.status}`);
  return (await res.json()).access_token;
}

async function fetchDetail(token, id) {
  const res = await fetch(`https://api.spotify.com/v1/albums/${id}?market=${MARKET}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) throw new RateLimited(`429 (retry-after ${res.headers.get("retry-after")})`);
  if (!res.ok) throw new Error(`album_${res.status} ${id}`);
  const album = await res.json();

  const tracks = (album.tracks?.items ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    trackNumber: t.track_number,
    durationMs: t.duration_ms,
    explicit: Boolean(t.explicit),
    artists: (t.artists ?? []).map((a) => ({ id: a.id ?? "", name: a.name })),
    spotifyUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  }));

  const copyrights = [
    ...new Set(
      (album.copyrights ?? [])
        .filter((c) => c.text)
        .map((c) => (/^[©℗]/.test(c.text) ? c.text : `${c.type === "P" ? "℗" : "©"} ${c.text}`)),
    ),
  ];

  return { tracks, label: album.label ?? null, copyrights };
}

async function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
  let file = { schemaVersion: 1, generatedAt: null, details: {} };
  try {
    file = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* ilk çalışma */
  }

  const missing = catalog.releases.filter((r) => !file.details[r.id]).slice(0, CAP);
  if (!missing.length) {
    console.log("[release-details] Eksik yok.");
    await setOutput("changed", "false");
    return;
  }

  console.log(`[release-details] ${missing.length} sürüm çekilecek`);
  let added = 0;
  let stoppedBy = null;

  try {
    const token = await getToken();
    for (const release of missing) {
      const detail = await fetchDetail(token, release.id);
      if (detail.tracks.length) {
        file.details[release.id] = detail;
        added += 1;
      }
      await sleep(GAP_MS);
    }
  } catch (error) {
    if (!(error instanceof RateLimited)) throw error;
    stoppedBy = error.message;
  }

  if (added) {
    file.generatedAt = new Date().toISOString();
    await writeFile(OUT, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  }
  if (stoppedBy) {
    console.warn(`[release-details] Spotify rate limit: ${stoppedBy} — ${added} kayıt kaydedildi, kalanı sonraki çalışmada.`);
  }
  console.log(`[release-details] ${added} sürüm eklendi`);
  await setOutput("changed", String(added > 0));
}

main().catch(async (error) => {
  console.error("[release-details] HATA:", error.message || error);
  await setOutput("changed", "false");
  process.exit(1);
});
