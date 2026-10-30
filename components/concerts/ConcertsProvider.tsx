"use client";

import { createContext, useContext } from "react";

const ConcertStartsContext = createContext<string[]>([]);

/**
 * Sunucudan gelen (KV/yedek) yaklaşan konser başlangıç zamanları. Menü, "TAKVİM" öğesini
 * yalnızca gerçekten konser varsa gösterir (bölümle aynı veri kaynağı).
 */
export function ConcertsProvider({ startsAt, children }: { startsAt: string[]; children: React.ReactNode }) {
  return <ConcertStartsContext.Provider value={startsAt}>{children}</ConcertStartsContext.Provider>;
}

export function useConcertStarts(): string[] {
  return useContext(ConcertStartsContext);
}
