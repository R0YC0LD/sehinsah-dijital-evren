/**
 * data/generated içindeki tüm Spotify kapaklarını üç boyutta (640/300/64) public/media/covers altına indirir.
 * Dosyalar Spotify'daki özgün JPEG'lerdir, yeniden sıkıştırılmaz. Var olan dosya indirilmez.
 *
 *   npm run sync:covers
 *
 * Yeni dosya varsa GITHUB_OUTPUT'a `changed=true` yazar. İnmeyen kapak siteyi bozmaz:
 * next.config'deki fallback rewrite onu Spotify'dan getirir.
 */
import { appendFile, access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data", "generated");
const OUT = path.join(ROOT, "public", "media", "covers");
const SIZES = ["b273", "1e02", "4851"];

const exists = (file) => access(file).then(() => true, () => false);

async function download(id) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(`https://i.scdn.co/image/${id}`, { signal: AbortSignal.timeout(30000) });
      if (res.status === 404) return null;
      if (res.ok) {
        const body = Buffer.from(await res.arrayBuffer());
        if (body[0] === 0xff && body[1] === 0xd8) return body;
      }
    } catch {
      /* yeniden dene */
    }
    await new Promise((r) => setTimeout(r, attempt * 1000));
  }
  return null;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const hashes = new Set();
  for (const name of await readdir(DATA)) {
    const text = await readFile(path.join(DATA, name), "utf8");
    for (const m of text.matchAll(/ab67616d0000(?:b273|1e02|4851)([a-f0-9]{24})/g)) hashes.add(m[1]);
  }

  const missing = [];
  for (const hash of hashes) {
    for (const size of SIZES) {
      const id = `ab67616d0000${size}${hash}`;
      if (!(await exists(path.join(OUT, `${id}.jpg`)))) missing.push(id);
    }
  }

  let saved = 0;
  let failed = 0;
  let next = 0;
  const worker = async () => {
    while (next < missing.length) {
      const id = missing[next];
      next += 1;
      const body = await download(id);
      if (body) {
        await writeFile(path.join(OUT, `${id}.jpg`), body);
        saved += 1;
      } else {
        failed += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  console.log(`[covers] ${hashes.size} kapak, ${saved} yeni dosya, ${failed} inmedi`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${saved > 0}\n`);
}

main().catch((error) => {
  console.error("[covers] HATA:", error.message || error);
  process.exit(1);
});
