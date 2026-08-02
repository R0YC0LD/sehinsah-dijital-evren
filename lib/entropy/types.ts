export type EntropySlotId =
  | "menu-preview-corner"
  | "hero-lower-left"
  | "music-heading-edge"
  | "discography-divider"
  | "stage-poster-edge"
  | "instagram-ring-side"
  | "final-copy-corner"
  | "footer-credit-nearby";

export type EntropySlot = {
  id: EntropySlotId;
  section: "menu" | "hero" | "music" | "stage" | "instagram" | "final" | "footer";
  placement: string;
  required?: boolean;
};

export type EntropyToastState = {
  count: number;
  visible: boolean;
} | null;
