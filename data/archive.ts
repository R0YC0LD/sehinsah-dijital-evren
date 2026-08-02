export type ArchiveItem = {
  id: string;
  index: string;
  title: string;
  description: string;
  layout: "wide" | "tall" | "strip";
  href?: string;
};

export const archiveItems: ArchiveItem[] = [
  {
    id: "ses",
    index: "01",
    title: "SES",
    description: "Diskografi bağlantıları için ayrılmış alan.",
    layout: "wide",
  },
  {
    id: "goruntu",
    index: "02",
    title: "GÖRÜNTÜ",
    description: "Klipler ve görsel projeler için ayrılmış alan.",
    layout: "tall",
  },
  {
    id: "sahne",
    index: "03",
    title: "SAHNE",
    description: "Canlı performanslar için ayrılmış alan.",
    layout: "strip",
  },
];
