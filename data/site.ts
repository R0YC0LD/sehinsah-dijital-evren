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
    lineOne: "YERÇEKİMİNE KARŞI.",
    fragments: ["SÖZ", "SES", "DÜŞ"],
  },
  words: ["ANLAM DÜŞER. SES YÜKSELİR."],
  ticket: {
    title: "SAHNE",
    subtitle: "Canlı etkinlikler.",
    cta: "BUBİLET ↗",
  },
  archive: {
    title: "ARŞİV",
  },
  instagram: {
    title: "INSTAGRAM",
    handle: "@sehinsah",
    cta: "PROFİL ↗",
    ring: "@SEHINSAH • INSTAGRAM • ",
  },
  final: {
    lineOne: "DÜŞÜŞ BİTMEDİ.",
    backToTop: "BAŞA DÖN",
  },
  footer: {
    brand: "ŞEHİNŞAH",
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
