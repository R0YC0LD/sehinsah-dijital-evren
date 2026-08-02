import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const ARTIST_ID = "0FUsrstJwmg4WVHQMTYuUA";
const DEEZER_ARTIST_ID = "10003428";
const MARKET = process.env.SPOTIFY_MARKET || "TR";
const MAX_PAGES = 4;
const DISPLAY_NAME = "Şehinşah";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getSpotifyToken(clientId, clientSecret) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`token_${res.status}`);
  return (await res.json()).access_token;
}

function pickImage(images = []) {
  const preferred = images.find((img) => (img.width ?? 0) >= 500 && (img.width ?? 0) <= 700);
  return preferred?.url || images[0]?.url || null;
}

function normalizeSpotify(raw) {
  return {
    id: raw.id,
    name: raw.name,
    albumType: raw.album_type,
    releaseDate: raw.release_date || "",
    releaseYear: (raw.release_date || "").slice(0, 4),
    totalTracks: raw.total_tracks || 0,
    imageUrl: pickImage(raw.images),
    spotifyUrl: raw.external_urls?.spotify || `https://open.spotify.com/album/${raw.id}`,
    uri: raw.uri || `spotify:album:${raw.id}`,
    artists: (raw.artists || []).map((a) => a.name),
  };
}

function mapDeezerType(recordType) {
  const t = (recordType || "").toLowerCase();
  if (t === "album") return "album";
  if (t === "compile" || t === "compilation") return "compilation";
  // Spotify discography groups EP with singles
  if (t === "ep" || t === "single") return "single";
  return "single";
}

async function fetchSpotifyAlbums(token) {
  const collected = [];
  let next =
    `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums?include_groups=album,single&market=${MARKET}&limit=50`;
  let pages = 0;

  while (next && pages < MAX_PAGES) {
    const res = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`albums_${res.status}`);
    const data = await res.json();
    collected.push(...(data.items || []).map(normalizeSpotify));
    next = data.next;
    pages += 1;
  }
  return collected;
}

async function fetchDeezerAlbums() {
  const collected = [];
  let next = `https://api.deezer.com/artist/${DEEZER_ARTIST_ID}/albums?limit=50`;
  let pages = 0;

  while (next && pages < MAX_PAGES) {
    const res = await fetch(next, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SehinsahDijitalEvren/1.0 (catalog sync)",
      },
    });
    if (!res.ok) throw new Error(`deezer_${res.status}`);
    const data = await res.json();
    collected.push(...(data.data || []));
    next = data.next || null;
    pages += 1;
  }
  return collected;
}

async function resolveSpotifyAlbumId(title) {
  const query = `${title} ${DISPLAY_NAME}`;
  const target = `https://open.spotify.com/intl-tr/search/${encodeURIComponent(query)}`;
  const res = await fetch(`https://r.jina.ai/http://${target.replace(/^https?:\/\//, "")}`, {
    headers: { Accept: "text/plain", "User-Agent": "SehinsahDijitalEvren/1.0" },
  });
  if (!res.ok) return null;
  const text = await res.text();
  const match = text.match(/open\.spotify\.com\/album\/([a-zA-Z0-9]{22})/);
  return match?.[1] || null;
}

async function oEmbedAlbum(albumId) {
  const res = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/album/${albumId}`)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

async function buildFromDeezerWithSpotifyLinks() {
  const deezerAlbums = await fetchDeezerAlbums();
  const releases = [];
  const seenSpotify = new Set();

  console.log(`[sync] Resolving ${deezerAlbums.length} Deezer releases → Spotify album URLs`);

  for (let i = 0; i < deezerAlbums.length; i += 1) {
    const item = deezerAlbums[i];
    const title = item.title;
    process.stdout.write(`  [${i + 1}/${deezerAlbums.length}] ${title} … `);

    let spotifyId = null;
    try {
      spotifyId = await resolveSpotifyAlbumId(title);
    } catch {
      spotifyId = null;
    }

    if (!spotifyId) {
      console.log("skip (no spotify album)");
      await sleep(700);
      continue;
    }

    if (seenSpotify.has(spotifyId)) {
      console.log(`dup ${spotifyId}`);
      await sleep(400);
      continue;
    }
    seenSpotify.add(spotifyId);

    let imageUrl = item.cover_xl || item.cover_big || item.cover_medium || null;
    let displayName = title;
    try {
      const embed = await oEmbedAlbum(spotifyId);
      if (embed?.thumbnail_url) imageUrl = embed.thumbnail_url;
      if (embed?.title) displayName = embed.title;
    } catch {
      /* keep deezer meta */
    }

    const releaseDate = item.release_date || "";
    releases.push({
      id: spotifyId,
      name: displayName,
      albumType: mapDeezerType(item.record_type),
      releaseDate,
      releaseYear: releaseDate.slice(0, 4),
      totalTracks: item.nb_tracks || 0,
      imageUrl,
      spotifyUrl: `https://open.spotify.com/album/${spotifyId}`,
      uri: `spotify:album:${spotifyId}`,
      artists: [DISPLAY_NAME],
    });
    console.log(spotifyId);
    await sleep(850);
  }

  return releases;
}

function dedupe(items) {
  const byId = new Map();
  for (const item of items) byId.set(item.id, item);
  const seen = new Set();
  const out = [];
  for (const item of byId.values()) {
    const key = `${item.name.toLowerCase()}::${item.releaseYear}::${item.albumType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

async function keepExisting() {
  try {
    await readFile(OUT, "utf8");
    console.warn("[sync] Keeping existing catalog JSON");
  } catch {
    console.warn("[sync] No valid existing catalog to keep");
  }
}

async function writeCatalog(releases) {
  const sorted = dedupe(releases);
  const albums = sorted.filter((r) => r.albumType === "album" || r.albumType === "compilation");
  const singles = sorted.filter((r) => r.albumType === "single" || r.albumType === "ep");

  if (!sorted.length) {
    console.warn("[sync] Empty — keeping previous file");
    await keepExisting();
    return false;
  }

  // Guard: never write search URLs
  for (const r of sorted) {
    if (!r.spotifyUrl || r.spotifyUrl.includes("/search/")) {
      throw new Error(`invalid_spotify_url:${r.name}:${r.spotifyUrl}`);
    }
  }

  const catalog = {
    releases: sorted,
    albums,
    singles,
    latestRelease: sorted[0] || null,
    counts: {
      total: sorted.length,
      albums: albums.length,
      singles: singles.length,
    },
    updatedAt: new Date().toISOString(),
    source: "generated-json",
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`[sync] Wrote ${sorted.length} releases (${albums.length} albums, ${singles.length} singles) → ${OUT}`);
  return true;
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  try {
    if (clientId && clientSecret) {
      console.log("[sync] Using Spotify Web API");
      const token = await getSpotifyToken(clientId, clientSecret);
      const releases = await fetchSpotifyAlbums(token);
      await writeCatalog(releases);
      return;
    }

    console.warn("[sync] No Spotify credentials — resolving album URLs via Deezer + Spotify search pages");
    const releases = await buildFromDeezerWithSpotifyLinks();
    await writeCatalog(releases);
  } catch (error) {
    console.error("[sync] Failed:", error.message);
    await keepExisting();
    process.exitCode = 0;
  }
}

main();
