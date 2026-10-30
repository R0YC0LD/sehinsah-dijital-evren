/**
 * Şehinşah profilindeki YENİ sürümleri Spotify API'den bulup JSON yedeğine ekler.
 *
 *   node scripts/auto-sync-releases.mjs
 *
 * - Sadece ekler: var olan kayıtlara dokunmaz, hiçbir şeyi silmez.
 * - Sadece hedef sanatçı ID'si (0FUsrstJwmg4WVHQMTYuUA) olan sürümler girer.
 * - Yeni tekli/EP parçaları, ana sanatçı Şehinşah ise çalma kuyruğuna da eklenir.
 * - Değişiklik varsa GITHUB_OUTPUT'a `changed=true` ve `summary=...` yazar.
 * - Spotify 429 verirse hiçbir şey yazmadan temiz çıkar (sonraki çalışmada tekrar denenir).
 *
 * Gerekli env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (SPOTIFY_MARKET opsiyonel).
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const SINGLES = path.join(ROOT, "data", "generated", "spotify-single-tracks.json");
const TARGET = "0FUsrstJwmg4WVHQMTYuUA";
const MARKET = process.env.SPOTIFY_MARKET || "TR";
const PAGE_LIMIT = 10;
const MAX_PAGES = 20;
const MAX_NEW = 15;
const DENY = ["kader çıkmazı", "kamuran akkor", "samanyolu"];

class RateLimited extends Error {}

const denied = (name = "") => DENY.some((d) => name.toLowerCase().includes(d));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET tanımlı değil");
  }
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

async function api(token, url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 429) throw new RateLimited(`429 (retry-after ${res.headers.get("retry-after")})`);
  if (!res.ok) throw new Error(`api_${res.status} ${url}`);
  return res.json();
}

async function fetchAllAlbums(token) {
  const out = [];
  let next = `https://api.spotify.com/v1/artists/${TARGET}/albums?include_groups=album,single&market=${MARKET}&limit=${PAGE_LIMIT}`;
  for (let page = 0; next && page < MAX_PAGES; page += 1) {
    const data = await api(token, next);
    out.push(...(data.items || []));
    next = data.next;
    if (next) await sleep(150);
  }
  return out;
}

function pickImage(images = []) {
  const preferred = images.find((i) => (i.width ?? 0) >= 500 && (i.width ?? 0) <= 700);
  return preferred?.url || images[0]?.url || null;
}

function normalize(raw) {
  const artists = (raw.artists || []).map((a) => ({ id: a.id, name: a.name }));
  const spotifyUrl = raw.external_urls?.spotify || `https://open.spotify.com/album/${raw.id}`;
  const releaseDate = raw.release_date || "";
  return {
    id: raw.id,
    spotifyId: raw.id,
    objectType: "album",
    name: raw.name,
    albumType: raw.album_type,
    releaseDate,
    releaseYear: releaseDate.slice(0, 4),
    totalTracks: raw.total_tracks || 0,
    imageUrl: pickImage(raw.images),
    spotifyUrl,
    uri: raw.uri || `spotify:album:${raw.id}`,
    artists,
    containsTargetArtist: artists.some((a) => a.id === TARGET),
    verified: true,
  };
}

function isValid(r) {
  return (
    r.id &&
    r.containsTargetArtist &&
    !denied(r.name) &&
    !r.spotifyUrl.includes("/search/") &&
    r.spotifyUrl.includes(`/album/${r.id}`)
  );
}

const isSingleKind = (r) => r.albumType === "single" || r.albumType === "ep";

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/\r?\n/g, " ")}\n`);
}

async function main() {
  const catalog = await readJson(CATALOG);
  const singlesFile = await readJson(SINGLES);

  const knownIds = new Set(catalog.releases.map((r) => r.id));
  // Aynı ad + yıl + tür zaten varsa (ör. farklı pazar/yeniden yükleme) tekrar ekleme.
  const knownKeys = new Set(
    catalog.releases.map((r) => `${r.name.toLowerCase()}::${r.releaseYear}::${r.albumType}`),
  );

  const token = await getToken();
  const raw = await fetchAllAlbums(token);
  console.log(`[auto-sync] Spotify'da ${raw.length} sürüm, JSON'da ${catalog.releases.length}`);

  const fresh = [];
  for (const item of raw.map(normalize)) {
    if (!isValid(item) || knownIds.has(item.id)) continue;
    const key = `${item.name.toLowerCase()}::${item.releaseYear}::${item.albumType}`;
    if (knownKeys.has(key)) continue;
    knownIds.add(item.id);
    knownKeys.add(key);
    fresh.push(item);
  }

  if (!fresh.length) {
    console.log("[auto-sync] Yeni sürüm yok.");
    await setOutput("changed", "false");
    return;
  }
  if (fresh.length > MAX_NEW) {
    // Olağandışı bir şey (ör. API'nin beklenmedik yanıtı): körlemesine toplu ekleme yapma.
    throw new Error(`Beklenmedik sayıda yeni sürüm (${fresh.length}) — elle incele`);
  }

  const knownTrackIds = new Set(singlesFile.tracks.map((t) => t.id));
  const newTracks = [];
  for (const release of fresh.filter(isSingleKind)) {
    const page = await api(
      token,
      `https://api.spotify.com/v1/albums/${release.id}/tracks?market=${MARKET}&limit=50`,
    );
    for (const t of page.items || []) {
      const artists = (t.artists || []).map((a) => ({ id: a.id, name: a.name }));
      if (artists[0]?.id !== TARGET || knownTrackIds.has(t.id) || denied(t.name)) continue;
      const spotifyUrl = t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`;
      if (!spotifyUrl.includes(`/track/${t.id}`)) continue;
      knownTrackIds.add(t.id);
      newTracks.push({
        id: t.id,
        spotifyId: t.id,
        uri: `spotify:track:${t.id}`,
        spotifyUrl,
        name: t.name,
        durationMs: t.duration_ms || 0,
        albumId: release.id,
        albumName: release.name,
        artists,
        targetArtistIsPrimary: true,
        containsTargetArtist: true,
        verified: true,
      });
    }
    await sleep(150);
  }

  const now = new Date().toISOString();

  catalog.releases = [...fresh, ...catalog.releases].sort((a, b) =>
    a.releaseDate < b.releaseDate ? 1 : -1,
  );
  catalog.albums = catalog.releases.filter(
    (r) => r.albumType === "album" || r.albumType === "compilation",
  );
  catalog.singles = catalog.releases.filter(isSingleKind);
  catalog.latestRelease = catalog.releases[0] || null;
  catalog.counts = {
    total: catalog.releases.length,
    albums: catalog.albums.length,
    singles: catalog.singles.length,
    tracks: (catalog.tracks || []).length,
  };
  catalog.generatedAt = now;
  catalog.updatedAt = now;
  await writeJson(CATALOG, catalog);

  if (newTracks.length) {
    singlesFile.tracks = [...newTracks, ...singlesFile.tracks];
    singlesFile.counts = { total: singlesFile.tracks.length };
    singlesFile.generatedAt = now;
    await writeJson(SINGLES, singlesFile);
  }

  const summary = fresh.map((r) => `${r.name} (${r.releaseDate})`).join(", ");
  console.log(`[auto-sync] ${fresh.length} yeni sürüm, ${newTracks.length} yeni parça: ${summary}`);
  await setOutput("changed", "true");
  await setOutput("summary", summary);
}

main().catch(async (error) => {
  if (error instanceof RateLimited) {
    console.warn(`[auto-sync] Spotify rate limit: ${error.message} — hiçbir şey yazılmadı, sonraki çalışmada denenecek.`);
    await setOutput("changed", "false");
    return;
  }
  console.error("[auto-sync] HATA:", error.message || error);
  process.exit(1);
});
