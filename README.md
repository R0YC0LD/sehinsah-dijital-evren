# Şehinşah — Dijital Evren

Karanlık, sade ve sinematik sanatçı sitesi. Tek gerçekçi düşüş animasyonu, Spotify Web API diskografisi ve kontrollü kaos.

## Teknolojiler

- Next.js App Router + TypeScript
- GSAP ScrollTrigger + Lenis
- Spotify Web API (Client Credentials, server-only)
- CSS Modules

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Spotify Developer App

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → Create app
2. Client ID ve Client Secret’ı kopyala
3. `.env.local` içine ekle:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_MARKET=TR
SPOTIFY_REVALIDATE_SECONDS=21600
SPOTIFY_TOP_TRACKS_MODE=embed
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

**Önemli**

- Client Secret asla `NEXT_PUBLIC_` ile yayınlanmaz ve GitHub’a yüklenmez.
- Bu site ziyaretçiden Spotify girişi istemez; sunucu Client Credentials kullanır.
- Development Mode uygulamalar sınırlı erişimde olabilir.
- Popüler parçalar için varsayılan çözüm Artist Embed’dir (`SPOTIFY_TOP_TRACKS_MODE=embed`). Top Tracks API Development Mode’da güvenilir değildir.

## Albümler nasıl güncellenir?

`lib/spotify/artist.ts` Spotify `/artists/{id}/albums` endpoint’ini çeker, normalize eder, duplicate temizler ve `unstable_cache` ile saklar.

- Varsayılan cache: **6 saat** (`SPOTIFY_REVALIDATE_SECONDS=21600`)
- Credential yoksa veya API düşerse site çökmez; Embed + “Spotify’da aç” bağlantısı kalır.

## Bağlantılar ve görseller

- Tüm sabit URL’ler: `data/site.ts`
- Bubilet / Instagram / Spotify artist URL’leri burada değişir
- Yerel görseller:

```
public/media/sehinsah-falling.png
public/media/sehinsah-bubilet.png
public/media/sehinsah-instagram.png
```

## Komutlar

```bash
npm run dev
npm run lint
npm run build
npm start
```

## Deployment

### Vercel (önerilen)

1. Repo’yu Vercel’e bağla
2. Environment variables olarak Spotify secret’larını ekle
3. Deploy

ISR/cache ile albümler yaklaşık 6 saatte bir yenilenir.

### GitHub Pages (statik export)

```bash
# Windows PowerShell
$env:NEXT_OUTPUT="export"
$env:NEXT_PUBLIC_BASE_PATH="/sehinsah-dijital-evren"
$env:NEXT_PUBLIC_SITE_URL="https://R0YC0LD.github.io/sehinsah-dijital-evren"
# opsiyonel: Spotify secret’ları build sırasında albümleri dondurur
npm run build
```

Çıktı `out/` klasörüne yazılır. Statik ortamda runtime revalidate yoktur; albümler build anındaki veridir.

## Kaos modu

Header (masaüstü) / mobil menü içinde **SADE / KAOS** toggle. Tercih `localStorage` içinde saklanır. Reduced motion açıksa kaos hareketi artırılmaz.

## Mimari özet

```
app/                 page, layout, SEO
components/hero/     tek düşüş animasyonu
components/spotify/  embed + diskografi
components/sections/ Bubilet, Instagram, Final
lib/spotify/         server-only API client
data/site.ts         sabit içerik ve URL’ler
```
