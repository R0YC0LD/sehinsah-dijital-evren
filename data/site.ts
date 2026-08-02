export const siteConfig = {
  artistName: "ŞEHİNŞAH",
  shortMark: "ŞŞ",
  title: "Şehinşah — Dijital Evren",
  description:
    "Şehinşah’ın müzik, sahne ve dijital dünyasına açılan deneyimsel internet sitesi.",
  tagline: "YERÇEKİMİNE KARŞI SÖZLER",
  status: "DİJİTAL DENEYİM",
  isOfficial: false,
  unofficialDisclaimer: "Bağımsız dijital konsept çalışma.",
  contactEmail: "",
  links: {
    bubilet: "https://www.bubilet.com.tr/sanatci/sehinsah",
    instagram: "https://www.instagram.com/sehinsah/",
  },
  media: {
    falling: "/media/sehinsah-falling.png",
    bubilet: "/media/sehinsah-bubilet.png",
    instagram: "/media/sehinsah-instagram.png",
  },
  hero: {
    lineOne: "SÖZCÜKLER YUKARI.",
    lineTwo: "BEDEN AŞAĞI.",
    scrollCue: "AŞAĞI İN",
  },
  falling: {
    lineOne: "YERÇEKİMİ BEDENE İŞLER.",
    lineTwo: "SÖZE DEĞİL.",
    fragments: ["HIZ", "KATMAN", "SÖZ", "DÜŞ", "RİTİM", "SES"],
  },
  words: [
    "SÖZCÜKLER YERÇEKİMİ TANIMAZ.",
    "ANLAM DÜŞER, SES YÜKSELİR.",
    "HER HECE YENİ BİR KATMAN.",
    "KAOSUN İÇİNDE KUSURSUZ RİTİM.",
    "AŞAĞI İNDİKÇE SES YÜKSELİR.",
  ],
  ticket: {
    title: "SAHNEYE DÜŞ",
    subtitle: "Güncel konserleri ve etkinlikleri görüntüle.",
    cta: "ETKİNLİKLERİ GÖR ↗",
    note: "Güncel etkinlikleri Bubilet’te görüntüle",
  },
  archive: {
    title: "DİJİTAL ARŞİV",
    subtitle: "SES / GÖRÜNTÜ / SAHNE",
  },
  instagram: {
    title: "AKIŞIN DIŞINA ÇIK",
    handle: "@sehinsah",
    cta: "INSTAGRAM’A GİT ↗",
    ring: "@SEHINSAH • INSTAGRAM • @SEHINSAH • INSTAGRAM • ",
  },
  final: {
    lineOne: "DÜŞÜŞ BİTMEDİ.",
    lineTwo: "YALNIZCA EKRAN BİTTİ.",
    backToTop: "BAŞA DÖN ↑",
  },
  footer: {
    brand: "ŞEHİNŞAH",
    label: "DİJİTAL DENEYİM",
  },
  audioSrc: "",
} as const;

export const sections = [
  { id: "bosluk", index: "01", label: "BOŞLUK", href: "#bosluk" },
  { id: "dusus", index: "02", label: "DÜŞÜŞ", href: "#dusus" },
  { id: "soz", index: "03", label: "SÖZ", href: "#soz" },
  { id: "sahne", index: "04", label: "SAHNE", href: "#sahne" },
  { id: "arsiv", index: "05", label: "ARŞİV", href: "#arsiv" },
  { id: "instagram", index: "06", label: "INSTAGRAM", href: "#instagram" },
  { id: "sonsuzluk", index: "07", label: "SONSUZLUK", href: "#sonsuzluk" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
