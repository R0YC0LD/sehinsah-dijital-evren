/**
 * PWA ikonları (ana ekran) ve Entropi ödül duvar kağıtlarını app/icon.png (beyin maskotu) ve
 * mevcut görsellerden üretir. Çıktılar repoya commit'lenir; yalnızca tasarım değişince çalıştırılır.
 *
 *   npm run generate:pwa
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BG = "#040603";
const SOURCE = path.join(ROOT, "app", "icon.png");

const glow = (size, opacity = 0.34) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#31f77d" stop-opacity="${opacity}"/><stop offset="100%" stop-color="#31f77d" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );

/** Koyu zemin + yeşil hale + ortada beyin (scale: beyin/kenar oranı). */
async function icon(size, scale, out) {
  const brain = await sharp(SOURCE)
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: "contain" })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      { input: glow(size), left: 0, top: 0 },
      { input: brain, gravity: "center" },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(path.relative(ROOT, out));
}

async function main() {
  const dir = path.join(ROOT, "public", "icons");
  await mkdir(dir, { recursive: true });

  await icon(192, 0.74, path.join(dir, "icon-192.png"));
  await icon(512, 0.74, path.join(dir, "icon-512.png"));
  // Maskable: platform kırpması için güvenli alan (~%60)
  await icon(512, 0.58, path.join(dir, "maskable-512.png"));
  // Bildirim rozeti (Android durum çubuğu): şeffaf zeminde beyaz beyin silueti
  const alpha = await sharp(SOURCE).resize(96, 96, { fit: "contain" }).ensureAlpha().extractChannel("alpha").toBuffer();
  await sharp({ create: { width: 96, height: 96, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha)
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, "badge-96.png"));
  console.log("public/icons/badge-96.png");

  // iOS ana ekran ikonu (şeffaflık yok)
  await icon(180, 0.74, path.join(ROOT, "app", "apple-icon.png"));

  // Entropi ödül duvar kağıtları
  const rewards = path.join(ROOT, "public", "media", "rewards");
  await mkdir(rewards, { recursive: true });
  const character = path.join(ROOT, "public", "media", "sehinsah-falling.webp");

  async function wallpaper(width, height, out, { brainScale, characterScale, characterPos }) {
    const brainSize = Math.round(Math.min(width, height) * brainScale);
    const brain = await sharp(SOURCE).resize(brainSize, brainSize, { fit: "contain" }).toBuffer();
    const charSize = Math.round(Math.min(width, height) * characterScale);
    const fall = await sharp(character)
      .resize(charSize, charSize, { fit: "contain" })
      .modulate({ brightness: 0.8 })
      .rotate(-12, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: Math.floor(width * 0.98), height: Math.floor(height * 0.98), fit: "inside", withoutEnlargement: true })
      .toBuffer();
    const fallMeta = await sharp(fall).metadata();

    // Hafif tane (film grain) ve vinyet
    const overlay = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.78"/></radialGradient><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#31f77d" stop-opacity="0.30"/><stop offset="100%" stop-color="#31f77d" stop-opacity="0"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs><rect width="100%" height="100%" fill="${BG}"/><ellipse cx="50%" cy="52%" rx="${Math.round(width * 0.46)}" ry="${Math.round(height * 0.3)}" fill="url(#g)"/><rect width="100%" height="100%" filter="url(#n)" opacity="0.07"/><rect width="100%" height="100%" fill="url(#v)"/></svg>`,
    );

    await sharp(overlay)
      .composite([
        {
          input: fall,
          left: Math.round(width * characterPos.x - (fallMeta.width ?? charSize) / 2),
          top: Math.round(height * characterPos.y - (fallMeta.height ?? charSize) / 2),
        },
        { input: brain, left: Math.round((width - brainSize) / 2), top: Math.round(height * 0.5 - brainSize / 2) },
      ])
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(out);
    console.log(path.relative(ROOT, out));
  }

  await wallpaper(1170, 2532, path.join(rewards, "entropi-telefon.jpg"), {
    brainScale: 0.78,
    characterScale: 0.95,
    characterPos: { x: 0.68, y: 0.2 },
  });
  await wallpaper(2560, 1440, path.join(rewards, "entropi-masaustu.jpg"), {
    brainScale: 0.62,
    characterScale: 0.7,
    characterPos: { x: 0.86, y: 0.34 },
  });
}

main().catch((error) => {
  console.error("[generate-pwa-assets] failed:", error);
  process.exit(1);
});
