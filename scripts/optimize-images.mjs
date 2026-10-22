/**
 * public/media altındaki ağır görselleri WebP'ye çevirir.
 *
 *   npm run optimize:images
 *
 * - store/*.jpg  → store/*.webp (en uzun kenar ≤ 1100px)
 * - sehinsah-bubilet.png → sehinsah-bubilet.webp (PNG, OG görseli olarak kalır)
 * - sehinsah-falling.png → sehinsah-falling.webp (alfa korunur)
 * - storiesdown.webp → storiesdown-640.webp (640px)
 *
 * Kaynak JPG/PNG dosyaları silinmez; çıktı zaten güncelse atlanır.
 * `sharp` Next.js ile birlikte gelir, ayrıca kurulum gerekmez.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MEDIA = path.join(process.cwd(), "public", "media");

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function convert(input, output, { maxSide, quality, alpha = false }) {
  if (await exists(output)) {
    const [a, b] = await Promise.all([stat(input), stat(output)]);
    if (b.mtimeMs >= a.mtimeMs) return;
  }
  const image = sharp(input).rotate().resize({
    width: maxSide,
    height: maxSide,
    fit: "inside",
    withoutEnlargement: true,
  });
  await image.webp({ quality, alphaQuality: alpha ? 90 : undefined, effort: 5 }).toFile(output);
  const [a, b] = await Promise.all([stat(input), stat(output)]);
  console.log(
    `${path.relative(MEDIA, input)} ${(a.size / 1024).toFixed(0)}KB → ${(b.size / 1024).toFixed(0)}KB`,
  );
}

async function main() {
  const storeDir = path.join(MEDIA, "store");
  for (const file of await readdir(storeDir)) {
    if (!/\.jpe?g$/i.test(file)) continue;
    await convert(
      path.join(storeDir, file),
      path.join(storeDir, file.replace(/\.jpe?g$/i, ".webp")),
      { maxSide: 1100, quality: 80 },
    );
  }

  await convert(
    path.join(MEDIA, "sehinsah-bubilet.png"),
    path.join(MEDIA, "sehinsah-bubilet.webp"),
    { maxSide: 960, quality: 84 },
  );
  await convert(
    path.join(MEDIA, "sehinsah-falling.png"),
    path.join(MEDIA, "sehinsah-falling.webp"),
    { maxSide: 1000, quality: 88, alpha: true },
  );

  await convert(
    path.join(MEDIA, "storiesdown.webp"),
    path.join(MEDIA, "storiesdown-640.webp"),
    { maxSide: 640, quality: 82 },
  );
}

main().catch((err) => {
  console.error("[optimize-images] failed:", err);
  process.exit(1);
});
