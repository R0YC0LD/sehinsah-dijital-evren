import { readFile, writeFile } from "node:fs/promises";

const TARGET = "0FUsrstJwmg4WVHQMTYuUA";
const p = "data/generated/spotify-catalog.json";
const data = JSON.parse(await readFile(p, "utf8"));

const releases = (data.releases || [])
  .map((r) => {
    const id = r.spotifyId || r.id;
    if (!id || String(id).startsWith("deezer-")) return null;
    const spotifyUrl =
      r.spotifyUrl && !String(r.spotifyUrl).includes("/search/")
        ? r.spotifyUrl
        : `https://open.spotify.com/album/${id}`;
    if (!String(spotifyUrl).includes(`/album/${id}`)) return null;

    let artists;
    if (Array.isArray(r.artists) && typeof r.artists[0] === "string") {
      artists = r.artists.map((n) => ({ id: TARGET, name: n }));
    } else if (Array.isArray(r.artists)) {
      artists = r.artists.map((a) => ({ id: a.id || TARGET, name: a.name }));
    } else {
      artists = [{ id: TARGET, name: "Şehinşah" }];
    }

    return {
      id,
      spotifyId: id,
      objectType: "album",
      name: r.name,
      albumType: r.albumType,
      releaseDate: r.releaseDate || "",
      releaseYear: r.releaseYear || "",
      totalTracks: r.totalTracks || 0,
      imageUrl: r.imageUrl ?? null,
      spotifyUrl,
      uri: r.uri || `spotify:album:${id}`,
      artists,
      containsTargetArtist: true,
      verified: true,
    };
  })
  .filter(Boolean);

const albums = releases.filter((r) => r.albumType === "album" || r.albumType === "compilation");
const singles = releases.filter((r) => r.albumType === "single" || r.albumType === "ep");
const tracks = data.tracks || [];

const out = {
  releases,
  albums,
  singles,
  tracks,
  latestRelease: releases[0] || null,
  counts: {
    total: releases.length,
    albums: albums.length,
    singles: singles.length,
    tracks: tracks.length,
  },
  updatedAt: data.updatedAt || new Date().toISOString(),
  source: "generated-json",
};

await writeFile(p, `${JSON.stringify(out, null, 2)}\n`);
console.log("migrated", out.counts);
