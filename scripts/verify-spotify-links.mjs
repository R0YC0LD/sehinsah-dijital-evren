import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const ARTIST_ID = "0FUsrstJwmg4WVHQMTYuUA";

function isSearch(url = "") {
  return (
    url.includes("/search/") ||
    url.includes("spotify:search:") ||
    url.includes("?query=")
  );
}

function albumIdFromUrl(url = "") {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?album\/([a-zA-Z0-9]+)/i);
  return m?.[1] || null;
}

function trackIdFromUrl(url = "") {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/i);
  return m?.[1] || null;
}

async function main() {
  let raw;
  try {
    raw = await readFile(CATALOG, "utf8");
  } catch {
    console.warn("[verify-spotify] No catalog JSON — skip");
    return;
  }

  const data = JSON.parse(raw);
  const releases = data.releases || [];
  const tracks = data.tracks || [];
  const errors = [];
  const ids = new Set();

  if (!releases.length) {
    console.warn("[verify-spotify] Empty releases — allowed as fallback state");
    return;
  }

  for (const r of releases) {
    const id = r.spotifyId || r.id;
    if (!id) errors.push(`missing id: ${r.name}`);
    if (ids.has(id)) errors.push(`duplicate id: ${id}`);
    ids.add(id);
    if (!r.spotifyUrl) errors.push(`empty url: ${id}`);
    if (isSearch(r.spotifyUrl || "")) errors.push(`search url: ${id} ${r.spotifyUrl}`);
    const urlId = albumIdFromUrl(r.spotifyUrl || "");
    if (!urlId || urlId !== id) errors.push(`album url mismatch: ${id} vs ${r.spotifyUrl}`);
    if (r.verified === false) errors.push(`unverified release: ${id}`);
  }

  for (const t of tracks) {
    const id = t.spotifyId || t.id;
    if (!id) errors.push(`track missing id: ${t.name}`);
    if (isSearch(t.spotifyUrl || "")) errors.push(`track search url: ${id}`);
    const urlId = trackIdFromUrl(t.spotifyUrl || "");
    if (!urlId || urlId !== id) errors.push(`track url mismatch: ${id}`);
  }

  if (errors.length) {
    console.error("[verify-spotify] FAILED");
    for (const e of errors.slice(0, 40)) console.error(" -", e);
    process.exit(1);
  }

  console.log(
    `[verify-spotify] OK — ${releases.length} releases, ${tracks.length} tracks (artist ${ARTIST_ID})`,
  );
}

main();
