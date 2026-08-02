export const siteConfig = {
  artistName: "ŞEHİNŞAH",
  displayName: "Şehinşah",
  title: "Şehinşah — Resmî Dijital Evren",
  description:
    "Şehinşah’ın müzik, sahne ve dijital dünyasına açılan deneyimsel internet sitesi.",
  hero: {
    lineOne: "KELİMELER YÜKSELİR.",
    lineTwo: "BEDEN DÜŞER.",
    cta: "SPOTIFY’DA DİNLE ↗",
    scrollCue: "AŞAĞI",
  },
  music: {
    title: "MÜZİK",
    popularTitle: "SPOTIFY’DA POPÜLER",
    popularSubtitle: "Şehinşah’ın Spotify üzerindeki güncel popüler parçalarını dinle.",
    discographyTitle: "DİSKOGRAFİ",
    openCta: "SPOTIFY’DA AÇ ↗",
    attribution: "Albüm ve parça bilgileri Spotify tarafından sağlanmaktadır.",
    fallbackMessage: "Diskografiyi Spotify üzerinden görüntüleyebilirsiniz.",
  },
  tickets: {
    title: "SAHNE",
    subtitle: "Güncel konserleri ve etkinlikleri Bubilet üzerinden görüntüle.",
    cta: "ETKİNLİKLERİ GÖR ↗",
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
    backToTop: "BAŞA DÖN",
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
  nav: [
    { id: "hero", label: "Ana Sayfa", href: "#hero" },
    { id: "muzik", label: "Müzik", href: "#muzik" },
    { id: "sahne", label: "Sahne", href: "#sahne" },
    { id: "instagram", label: "Instagram", href: "#instagram" },
  ],
} as const;
