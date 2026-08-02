# Şehinşah — Dijital Evren

Şehinşah için karanlık, katmanlı, scroll tabanlı sinematik sanatçı deneyimi.

Konsept: **YERÇEKİMİNE KARŞI SÖZLER** — beden aşağı düşer, sözler yukarı yükselir.

> Bağımsız dijital konsept çalışma. Resmî yayın için `data/site.ts` içindeki `isOfficial` alanını `true` yapın.

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

## Production build

```bash
npm run build
```

Statik çıktı `out/` klasörüne yazılır (`output: "export"`).

## Görseller

Görselleri şu yollara koyun:

```
public/media/sehinsah-falling.png
public/media/sehinsah-bubilet.png
public/media/sehinsah-instagram.png
```

Orijinal dosya adları proje kökünde varsa kopyalanmış olmalıdır:

- `1000x1000-Photoroom.png` → `sehinsah-falling.png`
- `image (31).png` → `sehinsah-bubilet.png`
- `image (32).png` → `sehinsah-instagram.png`

Görsel yoksa ilgili bölüm fallback alanı gösterir; uygulama çökmez.

## Bağlantıları değiştirme

`data/site.ts`:

- `links.bubilet`
- `links.instagram`
- Menü / bölüm metinleri
- Footer ve disclaimer

## Arşiv öğesi ekleme

`data/archive.ts` içine yeni obje ekleyin:

```ts
{
  id: "yeni",
  index: "04",
  title: "BAŞLIK",
  description: "Açıklama",
  layout: "wide", // "wide" | "tall" | "strip"
  href: "https://...", // opsiyonel
}
```

## Konser / Bubilet

Bubilet URL’sini `data/site.ts` → `links.bubilet` üzerinden güncelleyin. Poster görseli `public/media/sehinsah-bubilet.png`.

## Kaos modu

Sağ alttaki control dock içindeki toggle:

- **SADE**: düşük grain / glitch
- **KAOS**: kontrollü bozulma artar

Tercih `localStorage` (`sehinsah-chaos-mode`) içinde saklanır. `prefers-reduced-motion` açıksa kaos görsel hareketleri artırılmaz.

## Environment variables

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (SEO, sitemap, OG) |
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages proje yolu (ör. `/sehinsah-dijital-evren`) |

Yerel geliştirmede her ikisini boş bırakabilirsiniz.

## GitHub Pages

- Repo: https://github.com/R0YC0LD/sehinsah-dijital-evren
- Canlı site: https://R0YC0LD.github.io/sehinsah-dijital-evren/

Şu an yayın `gh-pages` branch’inden yapılıyor (statik `out/` çıktısı).

Yerel yeniden deploy:

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_BASE_PATH="/sehinsah-dijital-evren"
$env:NEXT_PUBLIC_SITE_URL="https://R0YC0LD.github.io/sehinsah-dijital-evren"
npm run build
# ardından out/ içeriğini gh-pages branch'ine push edin
```

İsteğe bağlı: `.github/workflows/deploy.yml` dosyası GitHub Actions deploy’u için hazır. Token’da `workflow` scope yoksa bu dosya push edilemez; GitHub CLI ile `gh auth refresh -s workflow` sonrası Actions’a geçilebilir.

## Teknolojiler

- Next.js App Router + TypeScript
- GSAP + ScrollTrigger
- Lenis smooth scroll
- CSS Modules + global design tokens
- next/font (Bebas Neue + Space Grotesk)

## Dosya ağacı (özet)

```
app/                 layout, page, globals, SEO
components/
  loading/           IntroLoader
  layout/            Header, Menu, Cursor, Dock...
  sections/          Hero, Falling, Words, Ticket...
  effects/           Noise, Feathers, Glitch...
  ui/                Toggle, Marquee, ExternalLink
data/                site.ts, archive.ts
hooks/               Lenis, reduced motion, pointer...
public/media/        sanatçı görselleri
```
