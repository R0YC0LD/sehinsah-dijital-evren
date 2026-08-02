import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const ARTIST_ID = "0FUsrstJwmg4WVHQMTYuUA";
const DENY = ["kader çıkmazı", "kamuran akkor", "samanyolu", "deezer-"];

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

function denied(name = "", id = "") {
  const hay = `${name} ${id}`.toLowerCase();
  return DENY.some((d) => hay.includes(d));
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

  if (data.schemaVersion != null && Number(data.schemaVersion) < 4) {
    errors.push(`schemaVersion too old: ${data.schemaVersion}`);
  }
  if (data.targetArtistId && data.targetArtistId !== ARTIST_ID) {
    errors.push(`targetArtistId mismatch: ${data.targetArtistId}`);
  }
  if (data.source && data.source !== "spotify-api") {
    errors.push(`invalid source: ${data.source}`);
  }
  if (String(raw).toLowerCase().includes("deezer")) {
    errors.push("catalog contains deezer reference");
  }

  if (!releases.length) {
    console.warn("[verify-spotify] Empty releases — allowed as fallback state");
    console.log(
      JSON.stringify(
        {
          targetArtistId: ARTIST_ID,
          verifiedReleases: 0,
          rejectedReleases: 0,
          verifiedTracks: 0,
          schemaVersion: data.schemaVersion ?? null,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const r of releases) {
    const id = r.spotifyId || r.id;
    if (!id) errors.push(`missing id: ${r.name}`);
    if (ids.has(id)) errors.push(`duplicate id: ${id}`);
    ids.add(id);
    if (denied(r.name, id)) errors.push(`denylist hit: ${r.name}`);
    if (!r.spotifyUrl) errors.push(`empty url: ${id}`);
    if (isSearch(r.spotifyUrl || "")) errors.push(`search url: ${id} ${r.spotifyUrl}`);
    const urlId = albumIdFromUrl(r.spotifyUrl || "");
    if (!urlId || urlId !== id) errors.push(`album url mismatch: ${id} vs ${r.spotifyUrl}`);
    const artists = Array.isArray(r.artists) ? r.artists : [];
    const hasTarget = artists.some((a) => a && a.id === ARTIST_ID);
    if (!hasTarget) errors.push(`missing target artist id: ${id} ${r.name}`);
    if (r.verified === false) errors.push(`unverified release: ${id}`);
  }

  for (const t of tracks) {
    const id = t.spotifyId || t.id;
    if (!id) errors.push(`track missing id: ${t.name}`);
    if (denied(t.name, id)) errors.push(`track denylist: ${t.name}`);
    if (isSearch(t.spotifyUrl || "")) errors.push(`track search url: ${id}`);
    const urlId = trackIdFromUrl(t.spotifyUrl || "");
    if (!urlId || urlId !== id) errors.push(`track url mismatch: ${id}`);
    const artists = Array.isArray(t.artists) ? t.artists : [];
    if (!artists.some((a) => a && a.id === ARTIST_ID)) {
      errors.push(`track missing target artist id: ${id}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        targetArtistId: ARTIST_ID,
        verifiedReleases: releases.length,
        rejectedReleases: errors.length,
        verifiedTracks: tracks.length,
        searchUrls: errors.filter((e) => e.includes("search")).length,
        thirdPartyItems: errors.filter((e) => e.includes("deezer") || e.includes("denylist")).length,
        schemaVersion: data.schemaVersion ?? null,
      },
      null,
      2,
    ),
  );

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
