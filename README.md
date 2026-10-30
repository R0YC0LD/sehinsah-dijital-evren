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

### Otomatik senkronizasyon (Vercel)

Yeni çıkan tekli/EP, ek bir işlem gerekmeden siteye gelir:

1. Albüm listesi `SPOTIFY_REVALIDATE_SECONDS` (varsayılan 6 saat) aralığıyla Spotify API'den yenilenir.
2. Rastgele çalma kuyruğu (`verifiedSingleTracks`), `data/generated/spotify-single-tracks.json` içinde olmayan yeni sürümlerin parçalarını aynı yenilemede API'den ekler (`getVerifiedSingleTracksWithLive`). Ana sanatçı Şehinşah olmayan parçalar kuyruğa girmez.
3. API hata verirse (ör. 429 rate limit) site `data/generated/*.json` yedeğine düşer; aynı süreçte 5 dk tekrar denenmez.

Not: Spotify 429'da `Retry-After` saatlerce sürebilir; arka arkaya `npm run build` çalıştırmak (her build API'yi çağırır) limiti tetikler.
JSON yedeğini güncellemek için: `npm run sync:spotify` ve `npm run build:singles`.

### Otonom yeni sürüm senkronu (GitHub Actions)

`.github/workflows/sync-spotify.yml` günde 4 kez (01:30, 07:30, 13:30, 19:30 TR saati) çalışır:

1. `scripts/auto-sync-releases.mjs` Şehinşah profilini (artist ID `0FUsrstJwmg4WVHQMTYuUA`) Spotify API'den okur.
2. JSON'da olmayan yeni sürüm varsa `data/generated/spotify-catalog.json` ve (ana sanatçı Şehinşah ise) `spotify-single-tracks.json` dosyalarına **ekler** — mevcut kayıtlara dokunmaz.
3. `verify:spotify` + `verify-single-tracks` geçerse commit'ler ve `main`'e push eder; Vercel push'u görüp siteyi yeniden yayınlar.
4. Yeni sürüm yoksa hiçbir şey commit'lenmez. Spotify 429 verirse hiçbir şey yazılmaz, sonraki çalışmada denenir.

Kurulum (bir kez): GitHub repo > Settings > Secrets and variables > Actions > `SPOTIFY_CLIENT_ID` ve `SPOTIFY_CLIENT_SECRET` secret'larını ekle. Elle tetiklemek için Actions sekmesi > "Spotify yeni sürüm senkronu" > Run workflow. Yerelde denemek için `npm run sync:auto`.

### Parça sayfaları (`/muzik/<ad>-<yıl>`)

Her yayının kendi sayfası var (ör. `/muzik/70lik-2026`); katalogdaki her sürüm için otomatik oluşur, sitemap'e girer.

- **Veri:** Parça listesi, süre, etiket ve telif satırı `data/generated/release-details.json` içinden okunur (`scripts/sync-release-details.mjs` Spotify'dan doldurur, GitHub Action yeni sürümleri tamamlar). Böylece sayfalar statik üretilir ve ziyaretçi başına Spotify API'ye gidilmez (rate limit riski yok). JSON'da olmayan yeni bir sürüm için API denenir, olmazsa çalma kuyruğundaki parçalardan yedek kurulur — `lib/release/detail.ts`.
- **Klip:** `data/generated/youtube-videos.json` (resmî kanal) başlıkları parça/albüm adıyla **tam eşleşirse** üstte sessiz otomatik oynar ("SESİ AÇ" ile ses açılır; Spotify çalıyorsa duraklatılır). Eşleşme yoksa kapak sahnesi + Spotify oynatıcı. Yanlış eşleşmeyi düzeltmek için `data/track-videos.ts`.
- **YouTube listesi:** GitHub Action RSS ile günlük günceller; ilk toplu liste için `node scripts/sync-youtube.mjs --deep`.

### Konser takvimi (otomatik)

Ana sayfadaki "KONSER TAKVİMİ" bölümü (menüde TAKVİM) `data/generated/concerts.json` dosyasından beslenir; yatay kaydırmalı kartlar, geri sayım ve schema.org `MusicEvent` verisi üretir.

- **Kaynak:** Bubilet sanatçı sayfası (`/sanatci/sehinsah`) ve etkinlik sayfaları — `robots.txt`'in izin verdiği sayfalar, dürüst User-Agent, az istek.
- **Güncelleme:** `scripts/sync-concerts.mjs` yeni etkinlik ekler, **tarihi geçeni veya Bubilet'ten kalkanı siler**; değişiklik varsa `data/generated/concerts.json` commit'lenip push edilir (Vercel yeniden yayınlar). **Not:** Bubilet (Cloudflare) GitHub Actions sunucularına `HTTP 403` veriyor, bu yüzden script GitHub Action'da DEĞİL, Bubilet'e erişebilen bir yerden (kendi bilgisayar / zamanlanmış görev) çalıştırılmalıdır.
- **Eski/boş veri olmaması için:** (1) Bubilet'in "N seans listeleniyor" bilgisi okunan bağlantı sayısıyla tutmazsa hiçbir şey yazılmaz ve çalışma hata verir (e-posta gelir); (2) Bubilet'e ulaşılamazsa mevcut veri korunur ve çalışma yine hata verir (sessizce eskimez); (3) sayfa tarayıcıda şimdiki zamana göre süzülür — geçmiş konser statik sayfada kalsa bile gizlenir; (4) hiç yaklaşan konser kalmazsa bölüm ve menü öğesi tamamen kaybolur.
- **Elle çalıştırma:** `npm run sync:concerts`.

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

## Music start gate

### Why autoplay requires a user gesture

Browsers block audible autoplay until a real user click/tap/key gesture. Spotify’s embed `controller.play()` must therefore run inside that gesture’s call stack — not after `setTimeout` / `requestAnimationFrame` / long async prep.

### Music start gate flow

1. Video loading (if enabled) finishes first — gate never stacks under the loader.
2. Random verified single is preloaded into the Spotify iframe.
3. `MusicStartGate` appears (`z-index` ~1000) after the player reports ready.
4. User taps **DENEYİMİ BAŞLAT** → `play()` in the click handler.
5. Gate closes on `playback_started` (fallback retry at ~1.6s if playback never starts).
6. Falling character audio-pulse binds to playback position.

Files: `components/audio/MusicStartGate.tsx`, `MusicStartGate.module.css`, `hooks/useMusicStartGate.ts`.

### Playback_started close condition

Gate closes only after a live `playback_started` / playing update. Failed starts show retry (**MÜZİĞİ BAŞLAT**) without freezing the site.

### Silent continue behavior

**SESSİZ DEVAM ET** dismisses the gate without starting Spotify. Pulse stays off until the user later starts the player manually.

### Session re-check logic

`sessionStorage` key `sehinsah-audio-unlocked-v1` is written after real playback. On hard reload the player may probe autoplay; if that fails the gate shows again even when the session key exists. LocalStorage alone never skips the gate.

### Neon green design tokens

```css
--sehinsah-green: #31f77d;
--sehinsah-green-soft / -faint / -line / -glow
```

Black base (`--bg: #030303`) is preserved. Green is limited to music/active accents (gate CTA, filters, playing status, progress rail, Spotify hover).

### Neon glow limits

Glow opacity stays low (`≤ ~0.16` on small UI, character edge glow `≤ 0.035` / blur `≤ 8px`). No full-screen green bloom.

### Character audio-reactive equalizer

Outer fall wrapper (ScrollTrigger Y / X / rotation) is untouched. Inner `[data-audio-reactive]` scales smoothly from bass/kick energy (continuous equalizer envelope — **not** a double heartbeat). Authored maps: `data/audio-analysis/`; missing maps use BPM/kick-pattern fallback (`lib/audio/energy-map.ts`). Spotify iframe audio is never wired to `AnalyserNode`.

## Entropi Avcısı easter egg

Hidden hunt for `entropyConfig.total` (default 5) green brain icons.

### How to replace beyin.png

1. Put source at `public/media/easteregg/source/beyin.png`
2. Alpha-crop + export 256 WebP to `public/media/easteregg/entropy-brain.webp` (keep transparency)
3. Wide transparent padding should be cropped before use as a tiny icon

### How to add efekt.mp3

Place at `public/audio/easteregg/efekt.mp3`. Single shared `Audio` instance; missing file does not break collecting.

### How to replace video.mp4

Replace `public/media/easteregg/entropy-complete.mp4` (prefer `faststart`). Poster: `public/media/easteregg/entropy-complete-poster.webp`.

### How to change total Entropi count

Edit `data/entropy.ts` → `entropyConfig.total`. Slot pool lives in `data/entropy-slots.ts`; menu slot is always included.

### Safe placement slot format

```ts
{ id, section, placement, required? }
```

Positions are CSS classes in `EntropyBrain.module.css` (`slot-*`). Session seed shuffles optional slots; refresh keeps the same set.

### Session reset behavior

Keys in `sessionStorage`: seed / collected / completed / video-shown. New browser session reshuffles. Dev only: `?resetEntropy=1`.

### Video fallback behavior

If autoplay fails, overlay still opens with **VİDEOYU BAŞLAT**. Load error shows a success panel with close. Spotify pauses while video is open and resumes only if it was playing before.

### Development reset query

`?resetEntropy=1` clears session entropy keys in development only.

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
