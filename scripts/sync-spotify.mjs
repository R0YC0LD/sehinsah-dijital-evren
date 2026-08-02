import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const ARTIST_ID = "0FUsrstJwmg4WVHQMTYuUA";
const MARKET = process.env.SPOTIFY_MARKET || "TR";
const MAX_PAGES = 4;

async function getToken(clientId, clientSecret) {
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
  const data = await res.json();
  return data.access_token;
}

function pickImage(images = []) {
  const preferred = images.find((img) => (img.width ?? 0) >= 500 && (img.width ?? 0) <= 700);
  return preferred?.url || images[0]?.url || null;
}

function normalize(raw) {
  return {
    id: raw.id,
    name: raw.name,
    albumType: raw.album_type,
    releaseDate: raw.release_date,
    releaseYear: (raw.release_date || "").slice(0, 4),
    totalTracks: raw.total_tracks,
    imageUrl: pickImage(raw.images),
    spotifyUrl: raw.external_urls?.spotify,
    uri: raw.uri,
    artists: (raw.artists || []).map((a) => a.name),
  };
}

async function fetchAlbums(token) {
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
    collected.push(...(data.items || []));
    next = data.next;
    pages += 1;
  }

  return collected;
}

function dedupe(items) {
  const byId = new Map();
  for (const item of items) byId.set(item.id, item);
  const seen = new Set();
  const out = [];
  for (const item of byId.values()) {
    const key = `${item.name.toLowerCase()}::${item.releaseYear}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

async function keepExisting() {
  try {
    const raw = await readFile(OUT, "utf8");
    JSON.parse(raw);
    console.warn("[sync-spotify] Keeping existing catalog JSON");
  } catch {
    console.warn("[sync-spotify] No valid existing catalog to keep");
  }
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.warn("[sync-spotify] Missing credentials — skip");
    await keepExisting();
    return;
  }

  try {
    const token = await getToken(clientId, clientSecret);
    const raw = await fetchAlbums(token);
    const releases = dedupe(raw.map(normalize));
    const albums = releases.filter((r) => r.albumType === "album");
    const singles = releases.filter((r) => r.albumType === "single");

    if (!releases.length) {
      console.warn("[sync-spotify] Empty response — keeping previous file");
      await keepExisting();
      return;
    }

    const catalog = {
      releases,
      albums,
      singles,
      latestRelease: releases[0] || null,
      counts: {
        total: releases.length,
        albums: albums.length,
        singles: singles.length,
      },
      updatedAt: new Date().toISOString(),
      source: "generated-json",
    };

    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log(`[sync-spotify] Wrote ${releases.length} releases → ${OUT}`);
  } catch (error) {
    console.error("[sync-spotify] Failed:", error.message);
    await keepExisting();
    process.exitCode = 0;
  }
}

main();
