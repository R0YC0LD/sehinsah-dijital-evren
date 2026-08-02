const isOfficial = false;

export const siteConfig = {
  artistName: "ŞEHİNŞAH",
  displayName: "Şehinşah",
  isOfficial,
  title: isOfficial ? "Şehinşah — Resmî Dijital Evren" : "Şehinşah — Dijital Evren",
  description:
    "Şehinşah’ın müzik, sahne ve dijital dünyasına açılan deneyimsel internet sitesi.",
  hero: {
    lineOne: "KELİMELER YÜKSELİR.",
    lineTwo: "BEDEN DÜŞER.",
    cta: "MÜZİĞE GİR",
    scrollCue: "AŞAĞI",
    meta: "01 / DİJİTAL EVREN",
  },
  music: {
    title: "MÜZİK",
    subtitle: "Güncel yayınlar, kısa önizlemeler ve diskografi.",
    listenLabel: "DİNLE ↗",
    popularTitle: "GÜNCEL DİNLEME",
    popularSubtitle: "Şehinşah’ın resmî müzik sayfasını burada dinle.",
    openCta: "SPOTIFY’DA AÇ ↗",
    discographyTitle: "DİSKOGRAFİ",
    featuredTitle: "ÖNE ÇIKAN KISA ÖNİZLEMELER",
    latestTitle: "SON YAYIN",
    attribution: "Katalog verileri yaklaşık altı saatte bir yenilenir.",
    fallbackTitle: "DİSKOGRAFİ YENİLENİYOR",
    fallbackMessage: "Şehinşah’ın güncel müzik sayfasını aç.",
    fallbackCta: "MÜZİĞE GİT ↗",
    enableAudioLabel: "SES ÖNİZLEMELERİNİ AÇ",
    noPreview: "ÖNİZLEME YOK",
  },
  tickets: {
    title: "SAHNE",
    subtitle: "Güncel konserleri ve etkinlikleri görüntüle.",
    cta: "ETKİNLİKLERİ GÖR ↗",
    meta: "CANLI / ETKİNLİKLER",
    label: "Bubilet",
    url: "https://www.bubilet.com.tr/sanatci/sehinsah",
  },
  instagram: {
    title: "AKIŞIN DIŞINA ÇIK",
    username: "@sehinsah",
    cta: "INSTAGRAM’A GİT ↗",
    url: "https://www.instagram.com/sehinsah/",
    ring: "@SEHINSAH • INSTAGRAM • @SEHINSAH • ",
  },
  final: {
    lineOne: "DÜŞÜŞ BİTMEDİ.",
    lineTwo: "YALNIZCA SAYFA SONA ERDİ.",
    backToTop: "BAŞA DÖN ↑",
  },
  links: {
    spotifyArtist:
      "https://open.spotify.com/intl-tr/artist/0FUsrstJwmg4WVHQMTYuUA",
    bubilet: "https://www.bubilet.com.tr/sanatci/sehinsah",
    instagram: "https://www.instagram.com/sehinsah/",
  },
  spotify: {
    artistId: "0FUsrstJwmg4WVHQMTYuUA",
    artistUrl:
      "https://open.spotify.com/intl-tr/artist/0FUsrstJwmg4WVHQMTYuUA",
    embedUrl:
      "https://open.spotify.com/embed/artist/0FUsrstJwmg4WVHQMTYuUA?utm_source=generator&theme=0",
  },
  media: {
    falling: "/media/sehinsah-falling.png",
    bubilet: "/media/sehinsah-bubilet.png",
    instagram: "/media/sehinsah-instagram.png",
  },
  audioPreview: {
    defaultDuration: 8,
    minDuration: 5,
    maxDuration: 10,
  },
  nav: [
    { id: "hero", index: "01", label: "ANA SAYFA", href: "#hero", preview: "falling" as const },
    { id: "muzik", index: "02", label: "MÜZİK", href: "#muzik", preview: "music" as const },
    { id: "sahne", index: "03", label: "SAHNE", href: "#sahne", preview: "bubilet" as const },
    { id: "instagram", index: "04", label: "INSTAGRAM", href: "#instagram", preview: "instagram" as const },
  ],
};

export type SiteConfig = typeof siteConfig;
