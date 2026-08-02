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
    description: "",
    layout: "wide",
  },
  {
    id: "goruntu",
    index: "02",
    title: "GÖRÜNTÜ",
    description: "",
    layout: "tall",
  },
  {
    id: "sahne",
    index: "03",
    title: "SAHNE",
    description: "",
    layout: "strip",
  },
];
