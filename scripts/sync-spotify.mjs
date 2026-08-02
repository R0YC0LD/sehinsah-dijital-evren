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
  return (await res.json()).access_token;
}

function pickImage(images = []) {
  const preferred = images.find((img) => (img.width ?? 0) >= 500 && (img.width ?? 0) <= 700);
  return preferred?.url || images[0]?.url || null;
}

function normalize(raw) {
  const artists = (raw.artists || []).map((a) => ({ id: a.id, name: a.name }));
  const hasTarget = artists.some((a) => a.id === ARTIST_ID);
  const spotifyUrl = raw.external_urls?.spotify || `https://open.spotify.com/album/${raw.id}`;
  return {
    id: raw.id,
    spotifyId: raw.id,
    objectType: "album",
    name: raw.name,
    albumType: raw.album_type,
    releaseDate: raw.release_date || "",
    releaseYear: (raw.release_date || "").slice(0, 4),
    totalTracks: raw.total_tracks || 0,
    imageUrl: pickImage(raw.images),
    spotifyUrl,
    uri: raw.uri || `spotify:album:${raw.id}`,
    artists,
    containsTargetArtist: hasTarget,
    verified:
      hasTarget &&
      !String(spotifyUrl).includes("/search/") &&
      String(spotifyUrl).includes(`/album/${raw.id}`),
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

async function fetchAlbumTracks(token, album, limitAlbums = 12) {
  const tracks = [];
  const albums = album.slice(0, limitAlbums);
  for (const item of albums) {
    let next = `https://api.spotify.com/v1/albums/${item.id}/tracks?market=${MARKET}&limit=50`;
    while (next) {
      const res = await fetch(next, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const t of data.items || []) {
        const artists = (t.artists || []).map((a) => ({ id: a.id, name: a.name }));
        const hasTarget = artists.some((a) => a.id === ARTIST_ID);
        const spotifyUrl = t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`;
        if (!hasTarget || String(spotifyUrl).includes("/search/")) continue;
        tracks.push({
          id: t.id,
          spotifyId: t.id,
          objectType: "track",
          name: t.name,
          trackNumber: t.track_number || 0,
          durationMs: t.duration_ms || 0,
          explicit: Boolean(t.explicit),
          spotifyUrl,
          uri: t.uri || `spotify:track:${t.id}`,
          imageUrl: item.imageUrl || null,
          albumId: item.id,
          albumName: item.name,
          artists,
          containsTargetArtist: true,
          verified: String(spotifyUrl).includes(`/track/${t.id}`),
        });
      }
      next = data.next;
    }
  }
  return tracks;
}

function dedupe(items) {
  const byId = new Map();
  for (const item of items) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

async function keepExisting() {
  try {
    await readFile(OUT, "utf8");
    console.warn("[sync-spotify] Keeping existing verified catalog JSON");
  } catch {
    console.warn("[sync-spotify] No existing catalog");
  }
}

async function writeCatalog(releases, tracks = []) {
  const verified = dedupe(releases.filter((r) => r.verified && r.containsTargetArtist));
  for (const r of verified) {
    if (!r.spotifyUrl || r.spotifyUrl.includes("/search/")) {
      throw new Error(`invalid_spotify_url:${r.name}`);
    }
  }

  const albums = verified.filter((r) => r.albumType === "album" || r.albumType === "compilation");
  const singles = verified.filter((r) => r.albumType === "single" || r.albumType === "ep");
  const verifiedTracks = tracks.filter((t) => t.verified && t.containsTargetArtist);

  if (!verified.length) {
    console.warn("[sync-spotify] Empty verified set — keeping previous file");
    await keepExisting();
    return;
  }

  const catalog = {
    releases: verified,
    albums,
    singles,
    tracks: verifiedTracks,
    latestRelease: verified[0] || null,
    counts: {
      total: verified.length,
      albums: albums.length,
      singles: singles.length,
      tracks: verifiedTracks.length,
    },
    updatedAt: new Date().toISOString(),
    source: "generated-json",
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[sync-spotify] Wrote ${verified.length} releases / ${verifiedTracks.length} tracks → ${OUT}`,
  );
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.warn(
      "[sync-spotify] Missing Spotify credentials — preserving existing verified JSON (no Deezer/search fallback)",
    );
    await keepExisting();
    return;
  }

  try {
    const token = await getToken(clientId, clientSecret);
    const raw = await fetchAlbums(token);
    const releases = dedupe(raw.map(normalize).filter((r) => r.verified));
    const tracks = await fetchAlbumTracks(token, releases, 12);
    await writeCatalog(releases, tracks);
  } catch (error) {
    console.error("[sync-spotify] Failed:", error.message);
    await keepExisting();
    process.exitCode = 0;
  }
}

main();
