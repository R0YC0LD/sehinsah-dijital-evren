"use client";

import { useEntropy } from "@/components/easteregg/EntropyProvider";

/** Convenience re-export for hunt consumers. */
export function useEntropyHunt() {
  return useEntropy();
}
