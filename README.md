# Şehinşah — Dijital Evren

Karanlık, sinematik sanatçı sitesi. Sıvı loading intro, global düşüş + physical motion shadow, Spotify direct-link katalog, touch-scrub menü, resmî platform ikonları.

**Ana üretim hedefi: Vercel** (6 saatlik server-side cache).  
**Yedek mirror: GitHub Pages** (static export).

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

Secret değerleri asla `NEXT_PUBLIC_` ile başlamamalı. Browser’a gönderilmez.

### Spotify direct link guarantees

- Albüm/track URL’leri yalnızca Spotify API `external_urls.spotify` veya exact ID ile üretilir.
- `/search/`, `spotify:search:` ve Deezer→Spotify search fallback yasaktır.
- `npm run verify:spotify` (ve `prebuild`) search URL veya ID uyuşmazlığında build’i durdurur.
- Kart yalnızca `verified === true` ve direct album/track URL doğrulaması geçince tıklanabilir olur.

### Verified catalog fallback

1. Vercel live Spotify cache (`unstable_cache`, ~6s)
2. `data/generated/spotify-catalog.json` (son başarılı verified JSON)
3. Kompakt artist-level fallback (grid gizlenir, artist CTA kalır)

`npm run sync:spotify` credential yoksa mevcut verified JSON’u korur; Deezer/search yazmaz.

### How to add exact featured track IDs

`data/featured-tracks.ts`:

```ts
export const featuredTrackIds = [
  { spotifyTrackId: "EXACT_TRACK_ID", previewSrc: "/audio/previews/foo.mp3" },
];
```

ID yoksa featured satırlar katalog track listesinden gelir; track yoksa alan artist embed’e bırakılır.

### How to add licensed audio previews

```text
public/audio/previews/track-slug.mp3
```

`featuredTrackIds` içinde `previewSrc` bağla. Kullanıcı **SES ÖNİZLEMELERİNİ AÇ** demeden ses başlamaz.

## Loading animation architecture

`components/loading/`

- `LoadingScreen.tsx` — fixed overlay (`z-index: 1400`), clip-path exit
- `LiquidWordmark.tsx` — SVG mask + yeşil sıvı dolum + kontrollü slime taşması
- `useLoadingIntro.ts` — sessionStorage ile yalnızca ilk document load; font/image race + timeout

### Liquid fill timing

- Fill ~2.05s, overflow ~0.32s, exit ~0.42s (`siteConfig.loading`)
- Dolum bitince ekstra bekleme yok; overlay açılır

### Slime overflow configuration

- %86 civarında 3–4 damla / kısa iplik
- Mobilde daha kısa süre ve daha az damla

### Loader reduced-motion behavior

- Hızlı dolu yazı + kısa fade; toplam ~600ms altı hedef

### Loader cleanup and ScrollTrigger refresh

- `body[data-loading]` scroll lock
- Complete → overlay unmount, `sehinsah:loading-complete` event, `ScrollTrigger.refresh()`

## Motion shadow physics

`components/global/GlobalFallingLayer.tsx`

- Tek fixed layer, tek ScrollTrigger, yalnızca Y hareketi
- Shadow mask tabanlı koyu bordo siluet (`#551014`), PNG kopyası değil
- `x` offset = 0; karakterle aynı dikey hat

### Motion shadow opacity limits

- Desktop rest ~0.028, max ≤ 0.066
- Mobile rest ~0.018, max ≤ 0.048

### Signed scroll direction behavior

- Aşağı scroll: trail yukarıda (negatif Y)
- Yukarı scroll: trail aşağıda (pozitif Y)
- Durunca rest değerlerine yumuşak dönüş

## Official platform links

Config: `data/site.ts` → `links`

- YouTube: `https://www.youtube.com/@SEHINSAHIKARUS`
- TikTok: `https://www.tiktok.com/@sehinsahtiktok` (tracking params yok)
- Apple Music: `https://music.apple.com/tr/artist/.../736313630?l=tr` (Instagram redirect yok)
- Spotify artist / Instagram / Bubilet aynı config üzerinden

### Brand icon source and license notes

`simple-icons` paketinden resmi marka path geometrileri (`BrandIcon.tsx`). CDN hotlink yok.

### Platform icon placement rules

- Menü footer: tüm platformlar
- Müzik: Spotify / Apple Music / YouTube
- Instagram section: Instagram / TikTok / YouTube
- Footer: tüm platformlar (metin tekrarı azaltılmış)

### Platform link accessibility

- Meaningful `aria-label`
- Min 44×44px touch
- Focus-visible + monochrome → controlled brand-color hover

### Platform analytics placements

Opsiyonel `data-analytics` / `data-placement` (`menu` | `music` | `footer` | `social-section`). Analytics linki geciktirmez.

## How touch menu scrubbing works

`InteractiveMenu` nav:

- Touch/pen pointer scrub (`elementFromPoint` + rAF throttle)
- Drag leave → navigate etmez; kısa tap → section’a gider
- Platform ikonları scrub alanının dışında (`touch-action: manipulation`)
- Preview: iki katmanlı crossfade

## Mobile design tokens

`app/globals.css` (`max-width: 899px`):

```css
--mobile-page-x, --mobile-section-y, --mobile-body, --mobile-h1/h2/h3
```

Global `transform: scale()` kullanılmaz.

## Analytics events

Privacy-friendly / optional. Örnekler: `menu_open`, `album_open`, `track_open`, `random_track`, `favorite_add`, `youtube_open`, `tiktok_open`, `apple_music_open`, `spotify_artist_open`, `instagram_open`, `bubilet_open`.

## Link verification command

```bash
npm run verify:spotify
```

`prebuild` içinde otomatik çalışır.

## Vercel deployment

```bash
vercel --prod
```

Env: Spotify credentials + `NEXT_PUBLIC_DEPLOY_TARGET=vercel`.

## Komutlar

```bash
npm run dev
npm run lint
npm run typecheck
npm run verify:spotify
npm run sync:spotify
npm run migrate:catalog
npm run build
npm start
```

## Kaos modu

Tam ekran menünün altında **SADE / KAOS**. Varsayılan SADE. localStorage’da saklanır.
