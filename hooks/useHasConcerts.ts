"use client";

import { useEffect, useState } from "react";
import { concerts } from "@/data/concerts";
import { upcomingConcerts } from "@/lib/concerts";

/**
 * Yaklaşan konser var mı? İlk render deterministik (sunucu ile aynı); mount'tan sonra
 * şu anki zamana göre düzeltilir, böylece eski bir statik sayfada geçmiş konser kalmaz.
 */
export function useHasConcerts(): boolean {
  const [has, setHas] = useState(concerts.length > 0);
  useEffect(() => {
    setHas(upcomingConcerts(concerts, Date.now()).length > 0);
  }, []);
  return has;
}
