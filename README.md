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

### Yayın ve parça sayfaları (`/muzik/<ad>-<yıl>[/<parça>]`)

Her yayının kendi sayfası var (ör. `/muzik/70lik-2026`); katalogdaki her sürüm için otomatik oluşur, sitemap'e girer. **Çok parçalı yayınlarda (EP/albüm) her parçanın da kendi sayfası vardır** (ör. `/muzik/entropi-2026/bu-ask-haram`): klip, süre ve Spotify bağlantısı o parçaya göre değişir; parça listesindeki → ile açılır, ana sayfadaki oynatıcıdan da "PARÇA SAYFASI" ile gidilir (`lib/release/page-data.ts`, `lib/release/track-links.ts`). Tek parçalı yayında parça adresi yayın sayfasına yönlenir. Sayfalarda **Spotify gömme oynatıcısı yoktur** (ana sayfadaki rastgele oynatıcı hariç).

- **Veri:** Parça listesi, süre, etiket ve telif satırı `data/generated/release-details.json` içinden okunur (`scripts/sync-release-details.mjs` Spotify'dan doldurur, GitHub Action yeni sürümleri tamamlar). Böylece sayfalar statik üretilir ve ziyaretçi başına Spotify API'ye gidilmez (rate limit riski yok). JSON'da olmayan yeni bir sürüm için API denenir, olmazsa çalma kuyruğundaki parçalardan yedek kurulur — `lib/release/detail.ts`.
- **Klip:** `data/generated/youtube-videos.json` (yalnızca resmî kanal) başlıkları parça/albüm adıyla **tam eşleşirse VE doğrulanırsa** kapak + oynat düğmesi olarak gösterilir; **tıklayınca klip SESLİ başlar** (kullanıcı hareketi olduğu için tarayıcılar izin verir; sitenin ana sayfadaki Spotify çalması otomatik duraklatılır). Doğrulama (`lib/youtube/matcher.mjs`): videonun **süresi** parça süresiyle (±%12, en az 15 sn) ve — yeni videolarda — **yayın tarihi** sürüm tarihiyle (±60 gün) uymalı; "Intro/Outro/Skit" gibi çok genel adlar ve 4 harften kısa adlar yalnızca süre doğrulamasıyla kabul edilir. Doğrulanamazsa klipsiz kapak sahnesi gösterilir (yanlış klip oynamaz). Denetim: `npm run audit:videos`; elle düzeltme/engelleme: `data/track-videos.json` (`"<spotify-id>": "<video-id>"` ya da `null`).
- **Kapak görselleri:** `components/ui/CoverImage.tsx` Spotify CDN'den doğrudan, ekrandaki boyuta uygun sürümü (64/300/640 px) yükler; yüklenirken iskelet gösterir, hata olursa yeniden dener ve büyük boyuta düşer (yarım/boş görsel kalmaz).
- **YouTube listesi:** GitHub Action RSS ile günlük günceller; ilk toplu liste için `node scripts/sync-youtube.mjs --deep`.

### Konser takvimi (otonom)

Ana sayfadaki "KONSER TAKVİMİ" (menüde TAKVİM): sıradaki konser paneli (canlı geri sayım, takvime ekle `.ics`/Google, yol tarifi, paylaş) + kaydırmalı diğer etkinlikler. schema.org `MusicEvent` verisi üretir.

**Kaynak:** Bubilet'teki Şehinşah sanatçı sayfası — Şehinşah'ın katıldığı/katılacağı TÜM etkinlikler (kendi konserleri, çok sanatçılı geceler, festivaller) otomatik bulunur. `robots.txt`'in izin verdiği sayfalar, dürüst User-Agent, az istek.

**Otomasyon (elle bir şey yapılmaz):**
- `vercel.json` → Vercel Cron günde 2 kez (TR saatiyle ~01:30 ve ~07:00; Hobby planda ±1 saat) `app/api/cron/concerts` rotasını çağırır.
- Rota Bubilet'i okur (`lib/concerts/bubilet.mjs`), değişiklik varsa **Upstash KV**'ye (`sehinsah:concerts:v1`) yazar ve siteyi tazeler (`revalidateTag`/`revalidatePath`). Yeni etkinlik eklenir; **tarihi geçen veya Bubilet'ten kalkan silinir**. Deploy/commit gerekmez.
- Site veriyi `lib/concerts/source.ts` ile okur: KV ve derlemeyle gelen yedek (`data/generated/concerts.json`) arasında `updatedAt`'ı yeni olan. Bu yüzden takvim boş kalmaz.

**Eski/boş/yanlış veri olmaması için:**
1. Bubilet'in "N seans listeleniyor" bilgisi okunan bağlantı sayısıyla tutmazsa hiçbir şey yazılmaz (sayfa yapısı değişmiş olabilir).
2. Bubilet'e ulaşılamazsa mevcut veri korunur (Vercel loglarında hata görünür).
3. Sayfa tarayıcıda şimdiki zamana göre süzülür: geçmiş konser statik sayfada kalsa bile gizlenir, sıradaki konser otomatik bir sonrakine geçer.
4. Hiç yaklaşan konser kalmazsa bölüm ve menü öğesi tamamen kaybolur.
5. Rota herkese açık çağrılsa da güvenlidir: 5 dk kilit + başarıda 30 dk bekleme. İsteğe bağlı `CRON_SECRET` tanımlanırsa `Authorization: Bearer` ister.

**Gereksinim:** Vercel projesinde Upstash KV bağlı olmalı (`KV_REST_API_URL`, `KV_REST_API_TOKEN` — yorumlarla aynı). Yoksa rota 503 verir ve site yedek dosyayı kullanır.
**Elle/yerel:** `npm run sync:concerts` yedek dosyayı günceller (GitHub Actions'tan Bubilet 403 verdiği için orada çalışmaz).

### Uygulama (PWA), bildirimler ve Derin Entropi

**PWA (telefona yükleme):** `app/manifest.ts` + `public/sw.js` + ikonlar (`public/icons/`, `app/apple-icon.png`; `npm run generate:pwa` ile `app/icon.png`'den üretilir). Chrome/Edge/Android "UYGULAMAYI YÜKLE" önerir (menüde ve bildirim penceresinde buton), iOS'ta Paylaş → Ana Ekrana Ekle talimatı gösterilir. Service worker bilerek minimaldir: **hiçbir sayfayı önbelleğe almaz** (eski içerik riski yok); yalnızca bağlantı yokken `offline.html` gösterir ve push bildirimlerini işler. Yalnızca production'da kaydedilir.

**Bildirimler (Web Push):** Ziyaretçi menüden, müzik bölümünden ya da takvimden "haber ver" ile konu seçerek (yeni parça/albüm, yeni konser) abone olur.
- Anahtarlar (VAPID) ilk kullanımda üretilip **Upstash KV**'ye yazılır; elle kurulum yok (isteğe bağlı: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Abonelikler KV'de (`sehinsah:push:subs`).
- **Tespit:** `/api/cron/notify` Spotify'dan taze sürüm listesini ve KV'deki konserleri "bilinenler" kümesiyle karşılaştırır (ilk çalışma mevcutları sessizce bilinen yapar; 21 günden eski sürüm duyurulmaz). Konser cron'u her çalışmada, GitHub Action günde 4 kez bu rotayı tetikler.
- **Sessiz saatler:** Gönderim yalnızca 09:00–22:00 (TR); gece bulunan olaylar kuyrukta bekler, sabah gider. 3'ten fazla birikmiş olay tek özet bildirime dönüşür.
- **Güvenlik/hijyen:** Abonelik uç noktaları yalnızca bilinen push servislerine (FCM, Mozilla, Apple, Windows) izinlidir (SSRF önlemi); IP başına hız sınırı; ölü abonelikler (404/410) otomatik silinir; kullanıcı yalnızca kendi cihazına test bildirimi gönderebilir.
- iOS'ta push yalnızca ana ekrana eklenmiş uygulamada çalışır. Brave'de "Push mesajları için Google hizmetlerini kullan" açık olmalı (arayüz bunu hatırlatır).

**Derin Entropi (2. seviye easter egg):** Ana sayfadaki 5 beyin (1. seviye) bitince kapı açılır: parça sayfalarının ~%35'inde, kullanıcıya özel (kalıcı) tohumdan türeyen yerlerde gizli beyinler belirir (`lib/entropy/deep.ts`). 5 FARKLI yayından beyin toplayan, menüdeki "ENTROPİ ARŞİVİ"nden de açılan ödül penceresinde duvar kağıtlarını (`public/media/rewards/`, `npm run generate:pwa` ile simetrik kompozisyonda üretilir) kazanır. İlerleme `localStorage`'dadır.

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

### Düşen karakter

`components/global/GlobalFallingLayer.tsx`: yol ve yön sabit (üstte −%64 ekran → altta +%124 ekran). Hareket tek bir `requestAnimationFrame` döngüsüyle, kare süresine bağlı sönümlü takiple sürülür; yalnızca `transform`/`opacity` yazılır (yeniden boyama yok), hareket yokken döngü durur. `prefers-reduced-motion`'da kapalıdır.
