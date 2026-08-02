# Şehinşah — Dijital Evren

Karanlık, sinematik sanatçı sitesi. **Provided Entropi MP4 video loader**, global düşüş + physical motion shadow, Spotify direct-link katalog (strict artist ID), touch-scrub menü, resmî platform ikonları.

**Ana üretim hedefi: Vercel** (6 saatlik server-side cache, catalog tag `spotify-sehinsah-catalog-v4`).  
Production: https://sehinsah-dijital-evren.vercel.app/

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Spotify credentials

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_MARKET=TR
SPOTIFY_REVALIDATE_SECONDS=21600
NEXT_PUBLIC_SITE_URL=https://sehinsah-dijital-evren.vercel.app
NEXT_PUBLIC_DEPLOY_TARGET=vercel
```

### Spotify direct link guarantees

- Albüm/track URL’leri yalnızca Spotify API `external_urls.spotify` veya exact ID ile üretilir.
- `/search/` ve Deezer→Spotify search fallback yasaktır.
- `npm run verify:spotify` denylist + exact artist ID + URL eşleşmesi zorunlu.
- Kart yalnızca `verified === true` ve direct album URL doğrulaması geçince tıklanabilir.

### Strict target artist ID validation

Hedef: `0FUsrstJwmg4WVHQMTYuUA`

- `artists.some(a => a.id === TARGET)` zorunlu.
- İsim eşleşmesi / varsayılan ID yazma yok.
- `Kader Çıkmazı`, `Kamuran Akkor`, `Samanyolu` denylist + ID audit ile temizlendi.
- Contaminated schema &lt; v4 JSON fallback olarak kabul edilmez.

### Catalog contamination cleanup

```bash
npm run purge:catalog   # Spotify album page artist-ID audit
npm run verify:spotify
```

### Verified catalog fallback

1. Vercel live Spotify cache (`spotify-sehinsah-catalog-v4`)
2. `data/generated/spotify-catalog.json` (schemaVersion 4, source `spotify-api`)
3. Kompakt artist CTA

### Vercel cache v4 invalidation

Cache key/tag: `spotify-sehinsah-catalog-v4`. Eski yanlış katalog bu sürümle geçersizleşir. Gerekirse Vercel’de “Redeploy without build cache”.

### How to add exact featured track IDs

`data/featured-tracks.ts` → `featuredTrackIds: [{ spotifyTrackId: "..." }]`.

### How to add licensed audio previews

`public/audio/previews/...` + `previewSrc`. Opt-in: **SES ÖNİZLEMELERİNİ AÇ**.

## Provided video loader source

Kaynak (kullanıcı yükledi): `bana_bir_şehinşah_entropi_kapa.mp4`  
ASCII kopya: `public/media/loading/sehinsah-entropi-loader-source.mp4`

Production assets:

```text
public/media/loading/sehinsah-entropi-loader.mp4
public/media/loading/sehinsah-entropi-loader-mobile.mp4
public/media/loading/sehinsah-entropi-loader.webm
public/media/loading/sehinsah-entropi-loader-poster.webp
```

Components:

- `VideoLoadingScreen.tsx`
- `useVideoLoadingIntro.ts`
- `VideoLoaderFallback.tsx`
- Legacy `LoadingScreen.tsx` / `LiquidWordmark.tsx` ana akışta kullanılmaz (SVG slime primary değil).

### Production video optimization commands

```bash
ffmpeg -i sehinsah-entropi-loader-source.mp4 -an -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 24 -movflags +faststart sehinsah-entropi-loader.mp4
ffmpeg -i sehinsah-entropi-loader-source.mp4 -an -vf "scale=854:-2:flags=lanczos" -c:v libx264 -preset slow -crf 26 -movflags +faststart sehinsah-entropi-loader-mobile.mp4
ffmpeg -i sehinsah-entropi-loader-source.mp4 -an -vf "scale=1280:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 35 sehinsah-entropi-loader.webm
ffmpeg -ss 0.20 -i sehinsah-entropi-loader-source.mp4 -frames:v 1 -vf "scale=1280:-2:flags=lanczos" sehinsah-entropi-loader-poster.webp
```

### Why audio is removed

Autoplay politikaları ve kullanıcı deneyimi için production loader dosyalarında AAC stream yok (`-an`). HTML ayrıca `muted` + `volume = 0`.

### Playback segment timing

```text
0.05–0.90 @ 1.45x
0.90–7.80 @ 1.90x
7.80–9.65 @ 2.25x
```

Finale ~9.65s → exit (~0.44s). Max visible 5500ms. Min ~2400ms.

### Video fallback behavior

`canplay` timeout / autoplay reject / codec fail → poster + kısa wipe → Hero. Yeni SVG wordmark üretilmez.

### Save-Data behavior

`navigator.connection.saveData` → kısa poster fallback (~1–1.2s), ağır video zorlanmaz.

### Session loader key

`sehinsah-video-intro-v3` — session başına bir kez. Dev: `?intro=1`.

### Loader reduced-motion / cleanup

- Reduced motion: poster + kısa reveal (&lt;700ms), video autoplay yok.
- Exit → listener/RVFC cleanup, `ScrollTrigger.refresh()`, `sehinsah:loading-complete`.

## Motion shadow physics

- Mask siluet, düşük opacity, aynı x, signed trail.
- Desktop rest ~0.028 / max ≤0.066; mobile rest ~0.018 / max ≤0.048.

### Desktop fall corridor

`--fall-x: 71.5vw`, `--fall-size: clamp(430px, 38vw, 720px)` — sağ boş koridor.

### Mobile centered fall axis

Portrait: `--fall-x: 50vw` (tam merkez). Landscape istisna: `62vw`.

### Reference screenshot responsive interpretation

Desktop sağ koridor + sol içerik; mobil portrait tam orta eksen; tek kaynak CSS değişkenleri (`globals.css`).

## Official platform links

Config: `data/site.ts`

- YouTube: `https://www.youtube.com/@SEHINSAHIKARUS`
- TikTok: `https://www.tiktok.com/@sehinsahtiktok`
- Apple Music: artist `736313630` direct URL
- Spotify / Instagram / Bubilet aynı config

Brand icons: `simple-icons` (`BrandIcon.tsx`). Placement: menü / müzik dinle / footer / sosyal.

## How touch menu scrubbing works

Touch/pen scrub on nav only; platform icons outside; drag ≠ navigate; tap navigates; preview crossfade.

## Mobile design tokens

`--mobile-page-x/y/body/h1/h2/h3` — global `transform: scale()` yok.

## Link verification command

```bash
npm run verify:spotify
```

## Vercel deployment

```bash
vercel --prod
```

## Komutlar

```bash
npm run dev
npm run lint
npm run typecheck
npm run verify:spotify
npm run purge:catalog
npm run sync:spotify
npm run build
```
