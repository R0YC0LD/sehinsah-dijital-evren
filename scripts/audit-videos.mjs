/**
 * Parça sayfalarındaki klip eşleşmelerini denetler: hangi parçaya hangi video bağlanıyor,
 * hangileri doğrulama yüzünden reddedildi.
 *
 *   npm run audit:videos            # eşleşenler + reddedilenler
 *   npm run audit:videos -- --all   # eşleşmeyenleri de listele
 *
 * Yanlış eşleşme görürsen data/track-videos.json içine override yaz (parça/albüm ID → video ID
 * ya da null).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildIndex, matchVideo } from "../lib/youtube/matcher.mjs";

const ROOT = process.cwd();
const read = async (...p) => JSON.parse(await readFile(path.join(ROOT, ...p), "utf8"));
const ALL = process.argv.includes("--all");

const [catalog, details, ytFile, overridesFile] = await Promise.all([
  read("data", "generated", "spotify-catalog.json"),
  read("data", "generated", "release-details.json"),
  read("data", "generated", "youtube-videos.json"),
  read("data", "track-videos.json"),
]);

const index = buildIndex(ytFile.videos);
const overrides = overridesFile.overrides ?? {};
const byId = new Map(ytFile.videos.map((v) => [v.id, v]));

let matched = 0;
let rejected = 0;
for (const release of catalog.releases) {
  const detail = details.details[release.id];
  if (!detail) continue;
  for (const t of detail.tracks) {
    const r = matchVideo(
      index,
      t.name,
      { durationMs: t.durationMs, releaseDate: release.releaseDate },
      { ids: [t.id], overrides },
    );
    const label = `${release.name} › ${t.name} (${Math.round(t.durationMs / 1000)}sn)`;
    if (r.id) {
      matched += 1;
      const v = byId.get(r.id);
      console.log(`✔ ${label}\n    → ${v?.title ?? r.id} [${v?.durationSec ?? "?"}sn] ${r.reason}`);
    } else if (r.reason.startsWith("rejected")) {
      rejected += 1;
      console.log(`✖ ${label}\n    → REDDEDİLDİ: "${r.title}" ${r.reason}`);
    } else if (ALL) {
      console.log(`· ${label} — ${r.reason}`);
    }
  }
}
console.log(`\n${matched} eşleşme, ${rejected} reddedilen (ad uydu ama süre/tarih tutmadı).`);
