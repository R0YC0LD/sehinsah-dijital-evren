import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "generated", "spotify-catalog.json");
const TARGET = "0FUsrstJwmg4WVHQMTYuUA";
const DENY_TITLES = [
  "kader çıkmazı",
  "kamuran akkor",
  "samanyolu",
];

function denied(name = "") {
  const n = name.toLowerCase();
  return DENY_TITLES.some((d) => n.includes(d));
}

async function pageHasTargetArtist(albumId) {
  const url = `https://open.spotify.com/album/${albumId}`;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; SehinsahCatalogAuditor/1.0)",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) return false;
  const html = await res.text();
  return html.includes(TARGET);
}

async function main() {
  const data = JSON.parse(await readFile(CATALOG, "utf8"));
  const releases = data.releases || [];
  const kept = [];
  const rejected = [];

  for (const r of releases) {
    const id = r.spotifyId || r.id;
    const name = r.name || "";
    if (!id || String(id).startsWith("deezer-") || denied(name)) {
      rejected.push({ id, name, reason: "denylist-or-invalid" });
      continue;
    }

    process.stdout.write(`check ${id} ${name}\n`);
    let ok = false;
    try {
      ok = await pageHasTargetArtist(id);
    } catch {
      ok = false;
    }

    if (!ok) {
      rejected.push({ id, name, reason: "missing-target-artist-id-on-page" });
      continue;
    }

    kept.push({
      id,
      spotifyId: id,
      objectType: "album",
      name: r.name,
      albumType: r.albumType || "single",
      releaseDate: r.releaseDate || "",
      releaseYear: r.releaseYear || String(r.releaseDate || "").slice(0, 4),
      totalTracks: r.totalTracks || 0,
      imageUrl: r.imageUrl ?? null,
      spotifyUrl: `https://open.spotify.com/album/${id}`,
      uri: `spotify:album:${id}`,
      artists: [{ id: TARGET, name: "Şehinşah" }],
      containsTargetArtist: true,
      verified: true,
    });

    await new Promise((r) => setTimeout(r, 250));
  }

  const albums = kept.filter((r) => r.albumType === "album" || r.albumType === "compilation");
  const singles = kept.filter((r) => r.albumType === "single" || r.albumType === "ep");

  const out = {
    schemaVersion: 4,
    source: "spotify-api",
    targetArtistId: TARGET,
    generatedAt: new Date().toISOString(),
    releases: kept,
    albums,
    singles,
    tracks: [],
    latestRelease: kept[0] || null,
    counts: {
      total: kept.length,
      albums: albums.length,
      singles: singles.length,
      tracks: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  await writeFile(CATALOG, `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        kept: kept.length,
        rejected: rejected.length,
        rejectedSample: rejected.slice(0, 20),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
