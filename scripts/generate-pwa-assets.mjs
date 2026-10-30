/**
 * PWA ikonları (ana ekran) ve Entropi ödül duvar kağıtlarını app/icon.png (beyin maskotu)'ndan
 * üretir. Çıktılar repoya commit'lenir; yalnızca tasarım değişince çalıştırılır.
 *
 *   npm run generate:pwa
 *
 * Duvar kağıdı yazıları sistemde "Impact" yazı tipi varsa onunla çizilir (site başlık fontu Anton'a en yakını).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BG = "#040603";
const GREEN = "#31f77d";
const SOURCE = path.join(ROOT, "app", "icon.png");

const glowSvg = (size, opacity = 0.34) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="${GREEN}" stop-opacity="${opacity}"/><stop offset="100%" stop-color="${GREEN}" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );

/** Koyu zemin + yeşil hale + ortada beyin (scale: beyin/kenar oranı). */
async function icon(size, scale, out) {
  const brain = await sharp(SOURCE)
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: "contain" })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      { input: glowSvg(size), left: 0, top: 0 },
      { input: brain, gravity: "center" },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(path.relative(ROOT, out));
}

const brainAt = (size) => sharp(SOURCE).resize(size, size, { fit: "contain" });

/** Opaklığı azaltılmış beyin (yörünge süsleri için). */
const fadedBrain = (size, alpha) =>
  brainAt(size).ensureAlpha().linear([1, 1, 1, alpha], [0, 0, 0, 0]).toBuffer();

/**
 * Tam SİMETRİK, ortalanmış kompozisyon: ortada büyük beyin, etrafında eş merkezli halkalar ve 8 küçük
 * beyinden oluşan yörünge, altında ortalı "ENTROPİ" yazısı ve ince simetrik çizgiler.
 * Önemli öğeler telefon saati (üst) ve dock (alt) bölgelerinin dışında tutulur.
 */
async function wallpaper({ width, height, out, cx, cy, brain, orbit, mini, titleY, titleSize, subY, subSize, lineY, rings }) {
  const spacing = Math.round(titleSize * 0.1);
  const subSpacing = Math.round(subSize * 0.38);
  // letter-spacing son harften sonra da boşluk bırakır; ortalamak için yarısı kadar sağa kaydır.
  const titleX = cx + spacing / 2;
  const subX = cx + subSpacing / 2;

  const ringShapes = rings
    .map(
      (r) =>
        `<circle cx="${cx}" cy="${cy}" r="${r.r}" fill="none" stroke="${GREEN}" stroke-opacity="${r.o}" stroke-width="${r.w}" ${r.dash ? `stroke-dasharray="${r.dash}"` : ""}/>`,
    )
    .join("");

  const half = Math.round(width * 0.16);
  const gap = Math.round(width * 0.025);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="${(cy / height) * 100}%" r="75%">
        <stop offset="0%" stop-color="#0c2a16"/><stop offset="45%" stop-color="#07140b"/><stop offset="100%" stop-color="${BG}"/>
      </radialGradient>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.30"/><stop offset="100%" stop-color="${GREEN}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="vig" cx="50%" cy="${(cy / height) * 100}%" r="78%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
      </radialGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(brain * 1.15)}" fill="url(#halo)"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(brain * 0.7)}" fill="url(#halo)"/>
    ${ringShapes}
    <rect width="100%" height="100%" filter="url(#grain)" opacity="0.06"/>
    <g text-anchor="middle" font-family="Impact, 'Arial Narrow', sans-serif">
      <text x="${titleX}" y="${titleY}" font-size="${titleSize}" letter-spacing="${spacing}" fill="#eee9df">ENTROPİ</text>
      <text x="${subX}" y="${subY}" font-size="${subSize}" letter-spacing="${subSpacing}" fill="${GREEN}" fill-opacity="0.9">ŞEHİNŞAH · DİJİTAL EVREN</text>
    </g>
    <g stroke="${GREEN}" stroke-opacity="0.35" stroke-width="2">
      <line x1="${cx - gap - half}" y1="${lineY}" x2="${cx - gap}" y2="${lineY}"/>
      <line x1="${cx + gap}" y1="${lineY}" x2="${cx + gap + half}" y2="${lineY}"/>
    </g>
    <rect x="${cx - 7}" y="${lineY - 7}" width="14" height="14" fill="${GREEN}" fill-opacity="0.8" transform="rotate(45 ${cx} ${lineY})"/>
    <rect width="100%" height="100%" fill="url(#vig)"/>
  </svg>`);

  const layers = [];
  // 8 küçük beyin: 45° aralıklı tam simetrik yörünge
  const small = await fadedBrain(mini, 0.38);
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    layers.push({
      input: small,
      left: Math.round(cx + Math.cos(a) * orbit - mini / 2),
      top: Math.round(cy + Math.sin(a) * orbit - mini / 2),
    });
  }
  layers.push({ input: await brainAt(brain).toBuffer(), left: Math.round(cx - brain / 2), top: Math.round(cy - brain / 2) });

  await sharp(svg).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
  console.log(path.relative(ROOT, out));
}

async function main() {
  const dir = path.join(ROOT, "public", "icons");
  await mkdir(dir, { recursive: true });

  await icon(192, 0.74, path.join(dir, "icon-192.png"));
  await icon(512, 0.74, path.join(dir, "icon-512.png"));
  // Maskable: platform kırpması için güvenli alan (~%60)
  await icon(512, 0.58, path.join(dir, "maskable-512.png"));
  // iOS ana ekran ikonu (şeffaflık yok)
  await icon(180, 0.74, path.join(ROOT, "app", "apple-icon.png"));

  // Bildirim rozeti (Android durum çubuğu): şeffaf zeminde beyaz beyin silueti
  const alpha = await sharp(SOURCE).resize(96, 96, { fit: "contain" }).ensureAlpha().extractChannel("alpha").toBuffer();
  await sharp({ create: { width: 96, height: 96, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha)
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, "badge-96.png"));
  console.log("public/icons/badge-96.png");

  // Entropi ödül duvar kağıtları
  const rewards = path.join(ROOT, "public", "media", "rewards");
  await mkdir(rewards, { recursive: true });

  await wallpaper({
    width: 1170,
    height: 2532,
    out: path.join(rewards, "entropi-telefon.jpg"),
    cx: 585,
    cy: 1090,
    brain: 640,
    orbit: 430,
    mini: 100,
    titleY: 1830,
    titleSize: 210,
    subY: 1925,
    subSize: 44,
    lineY: 2005,
    rings: [
      { r: 350, o: 0.34, w: 3 },
      { r: 430, o: 0.16, w: 2, dash: "3 15" },
      { r: 540, o: 0.2, w: 2 },
      { r: 690, o: 0.1, w: 2, dash: "2 18" },
    ],
  });
  await wallpaper({
    width: 2560,
    height: 1440,
    out: path.join(rewards, "entropi-masaustu.jpg"),
    cx: 1280,
    cy: 560,
    brain: 580,
    orbit: 400,
    mini: 90,
    titleY: 1215,
    titleSize: 170,
    subY: 1290,
    subSize: 38,
    lineY: 1352,
    rings: [
      { r: 335, o: 0.34, w: 3 },
      { r: 400, o: 0.16, w: 2, dash: "3 15" },
      { r: 500, o: 0.2, w: 2 },
      { r: 640, o: 0.1, w: 2, dash: "2 18" },
    ],
  });
}

main().catch((error) => {
  console.error("[generate-pwa-assets] failed:", error);
  process.exit(1);
});
