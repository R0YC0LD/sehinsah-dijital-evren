# Şehinşah — Dijital Evren

Karanlık, sinematik sanatçı sitesi. Global düşüş animasyonu, Spotify katalog entegrasyonu, etkileşimli menü.

**Ana üretim hedefi: Vercel** (6 saatlik server-side cache).  
**Yedek mirror: GitHub Pages** (scheduled static export).

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

## A. Vercel — canlı 6 saatlik yenileme

1. Repo’yu Vercel’e import et (Framework: Next.js).
2. Environment variables:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_MARKET=TR
SPOTIFY_REVALIDATE_SECONDS=21600
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEPLOY_TARGET=vercel
```

3. Deploy.

`lib/spotify/catalog-service.ts` katalogu server-side çeker ve ~6 saat cache’ler (`unstable_cache` + tag `spotify-sehinsah-catalog`).

Öncelik sırası:

1. Spotify Web API (credential varsa) — doğrudan albüm linkleri
2. `data/generated/spotify-catalog.json` (`npm run sync:spotify`)
3. Kompakt fallback UI

`sync:spotify` arama URL’si yazmaz; yalnızca `open.spotify.com/album/...` linkleri üretir.

Secret değerleri asla `NEXT_PUBLIC_` ile başlamamalı.

## B. GitHub Pages — scheduled mirror

```env
NEXT_PUBLIC_DEPLOY_TARGET=github-pages
NEXT_PUBLIC_BASE_PATH=/sehinsah-dijital-evren
NEXT_PUBLIC_SITE_URL=https://R0YC0LD.github.io/sehinsah-dijital-evren
```

Workflow: `.github/workflows/deploy-pages.yml`

- `main` push
- manuel dispatch
- yaklaşık her 6 saatte `cron`

Önce `scripts/sync-spotify.mjs` çalışır → `data/generated/spotify-catalog.json`  
Sonra static export üretilir.

GitHub Secrets:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

> Pages üzerinde runtime revalidation yoktur; veri build anında dondurulur.

## Spotify Developer App

1. https://developer.spotify.com/dashboard
2. Create app → Client ID / Secret
3. `.env.local` içine ekle
4. Secret’ı GitHub’a commit etme

Popüler parçalar için resmî Artist Embed kullanılır. Top Tracks API zorunlu değildir.

## Preview ses dosyaları

Lisanslı kısa klipleri buraya koy:

```text
public/audio/previews/track-slug.mp3
```

`data/featured-tracks.ts` içinde `previewSrc` bağla.

Kullanıcı önce **SES ÖNİZLEMELERİNİ AÇ** demeden ses başlamaz. Preview yoksa satır `ÖNİZLEME YOK` gösterir.

## Global düşüş

`components/global/GlobalFallingLayer.tsx`

- Sayfa seviyesinde `position: fixed`
- Tek ScrollTrigger (`start: 0`, `end: max`)
- Yalnızca dikey hareket
- Section arka planları şeffaf/yarı saydam; karakter içerik arkasında görünür

## Bağlantılar / görseller

`data/site.ts`

```text
public/media/sehinsah-falling.png
public/media/sehinsah-bubilet.png
public/media/storiesdown.webp
```

## Komutlar

```bash
npm run dev
npm run lint
npm run typecheck
npm run sync:spotify
npm run build
npm start
```

## Kaos modu

Tam ekran menünün altında **SADE / KAOS**. Varsayılan SADE. localStorage’da saklanır.
