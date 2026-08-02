import { entropyConfig } from "@/data/entropy";
import { seededShuffle } from "@/lib/entropy/seeded-random";
import type { EntropySlot, EntropySlotId } from "@/lib/entropy/types";

export const entropySlots: EntropySlot[] = [
  {
    id: "menu-preview-corner",
    section: "menu",
    placement: "preview-bottom-left",
    required: true,
  },
  {
    id: "hero-lower-left",
    section: "hero",
    placement: "lower-left-safe",
  },
  {
    id: "music-heading-edge",
    section: "music",
    placement: "heading-upper-right-safe",
  },
  {
    id: "discography-divider",
    section: "music",
    placement: "discography-divider-safe",
  },
  {
    id: "stage-poster-edge",
    section: "stage",
    placement: "poster-lower-edge-safe",
  },
  {
    id: "instagram-ring-side",
    section: "instagram",
    placement: "ring-left-safe",
  },
  {
    id: "final-copy-corner",
    section: "final",
    placement: "copy-upper-corner-safe",
  },
  {
    id: "footer-credit-nearby",
    section: "footer",
    placement: "footer-safe-corner",
  },
];

/** Pick a stable set of slots for this session seed. Menu slot is always included. */
export function selectEntropySlots(seed: string, total = entropyConfig.total): EntropySlotId[] {
  const required = entropySlots.filter((s) => s.required).map((s) => s.id);
  const optional = entropySlots.filter((s) => !s.required);
  const need = Math.max(0, total - required.length);

  const shuffled = seededShuffle(optional, seed);
  const picked: EntropySlot[] = [];
  const sectionCounts = new Map<string, number>();

  for (const slot of shuffled) {
    if (picked.length >= need) break;
    const count = sectionCounts.get(slot.section) || 0;
    if (count >= 1) continue;
    picked.push(slot);
    sectionCounts.set(slot.section, count + 1);
  }

  // Fallback if filters were too strict.
  if (picked.length < need) {
    for (const slot of shuffled) {
      if (picked.length >= need) break;
      if (picked.some((p) => p.id === slot.id)) continue;
      const count = sectionCounts.get(slot.section) || 0;
      if (count >= 2) continue;
      picked.push(slot);
      sectionCounts.set(slot.section, count + 1);
    }
  }

  return [...required, ...picked.map((s) => s.id)].slice(0, total);
}
