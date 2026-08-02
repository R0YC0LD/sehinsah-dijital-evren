import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const OUT = path.join(ROOT, "data", "generated", "spotify-single-tracks.json");
const TARGET = "0FUsrstJwmg4WVHQMTYuUA";
const DENY = ["kader çıkmazı", "kamuran akkor", "samanyolu"];

function denied(name = "") {
  const n = name.toLowerCase();
  return DENY.some((d) => n.includes(d));
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SehinsahTrackBuilder/1.0)",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.text();
}

function trackIdsFromAlbumHtml(html) {
  const ids = [];
  const patterns = [
    /(?:name|property)=["']music:song["'][^>]*content=["']https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})["']/gi,
    /content=["']https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})["'][^>]*(?:name|property)=["']music:song["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      if (!ids.includes(m[1])) ids.push(m[1]);
    }
  }
  if (ids.length) return ids;

  // Fallback: first unique /track/ links (less reliable)
  const loose = [...html.matchAll(/\/track\/([a-zA-Z0-9]{22})/g)].map((x) => x[1]);
  return [...new Set(loose)].slice(0, 1);
}

function parseTrackPage(html, trackId) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1] || "";
  const name = title
    .replace(/\s*[-–|].*$/, "")
    .replace(/\s+song and lyrics.*$/i, "")
    .trim();
  const hasTarget = html.includes(TARGET);
  // Primary if first artist mention after "by" is Şehinşah / target id appears before other artists near title
  const byMatch = title.match(/by\s+([^|<]+)/i);
  const byLine = (byMatch?.[1] || "").trim();
  const primaryName = byLine.split(",")[0]?.trim().toLowerCase() || "";
  const targetArtistIsPrimary =
    hasTarget &&
    (primaryName.includes("şehinşah") ||
      primaryName.includes("sehinsah") ||
      html.indexOf(TARGET) < (html.indexOf("spotify:artist:") + 1 || Infinity));

  return {
    id: trackId,
    name: name || trackId,
    hasTarget,
    targetArtistIsPrimary: Boolean(targetArtistIsPrimary && hasTarget),
    spotifyUrl: `https://open.spotify.com/track/${trackId}`,
    uri: `spotify:track:${trackId}`,
  };
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
  const singles = (catalog.releases || []).filter(
    (r) =>
      (r.albumType === "single" || r.albumType === "ep") &&
      r.verified !== false &&
      !denied(r.name) &&
      Array.isArray(r.artists) &&
      r.artists.some((a) => a.id === TARGET),
  );

  const byId = new Map();
  const rejected = [];

  for (const release of singles) {
    const albumId = release.spotifyId || release.id;
    try {
      const html = await fetchText(`https://open.spotify.com/album/${albumId}`);
      const trackIds = trackIdsFromAlbumHtml(html);
      if (!trackIds.length) {
        rejected.push({ id: albumId, name: release.name, reason: "no-tracks" });
        continue;
      }

      for (const trackId of trackIds) {
        if (byId.has(trackId)) continue;
        const trackHtml = await fetchText(`https://open.spotify.com/track/${trackId}`);
        const parsed = parseTrackPage(trackHtml, trackId);
        if (denied(parsed.name)) {
          rejected.push({ id: trackId, name: parsed.name, reason: "denylist" });
          continue;
        }
        if (!parsed.hasTarget || !parsed.targetArtistIsPrimary) {
          rejected.push({ id: trackId, name: parsed.name, reason: "not-primary-target" });
          continue;
        }

        byId.set(trackId, {
          id: trackId,
          spotifyId: trackId,
          uri: parsed.uri,
          spotifyUrl: parsed.spotifyUrl,
          name: parsed.name,
          durationMs: 0,
          albumId,
          albumName: release.name,
          artists: [{ id: TARGET, name: "Şehinşah" }],
          targetArtistIsPrimary: true,
          containsTargetArtist: true,
          verified: true,
        });
        await new Promise((r) => setTimeout(r, 80));
      }
      await new Promise((r) => setTimeout(r, 120));
    } catch (error) {
      rejected.push({ id: albumId, name: release.name, reason: String(error.message || error) });
    }
  }

  const tracks = [...byId.values()];
  const out = {
    schemaVersion: 1,
    source: "spotify-api",
    targetArtistId: TARGET,
    allowCollaborations: false,
    generatedAt: new Date().toISOString(),
    tracks,
    counts: { total: tracks.length },
  };

  await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        singlesScanned: singles.length,
        verifiedTracks: tracks.length,
        rejected: rejected.length,
        sample: tracks.slice(0, 8).map((t) => t.name),
        rejectedSample: rejected.slice(0, 10),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[build-single-tracks] failed:", err.message || err);
  process.exit(1);
});
