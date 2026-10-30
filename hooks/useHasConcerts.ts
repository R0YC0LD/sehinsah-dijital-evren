"use client";

import { useEffect, useState } from "react";
import { useConcertStarts } from "@/components/concerts/ConcertsProvider";
import { upcomingConcerts } from "@/lib/concerts";

/**
 * Yaklaşan konser var mı? İlk render deterministik (sunucu ile aynı); mount'tan sonra
 * şu anki zamana göre düzeltilir, böylece eski bir statik sayfada geçmiş konser kalmaz.
 */
export function useHasConcerts(): boolean {
  const startsAt = useConcertStarts();
  const [has, setHas] = useState(startsAt.length > 0);
  useEffect(() => {
    setHas(upcomingConcerts(startsAt.map((s) => ({ startsAt: s })), Date.now()).length > 0);
  }, [startsAt]);
  return has;
}
