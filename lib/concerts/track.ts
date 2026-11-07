export type ConcertAction = "ticket" | "calendar" | "maps" | "share";

const VISITOR_KEY = "sehinsah:visitor";

/** Tarayıcıya özel rastgele kimlik: aynı kişi iki kez sayılmasın diye, kişisel veri içermez. */
function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function trackConcert(id: string, action: ConcertAction): void {
  const body = JSON.stringify({ id, action, visitor: visitorId() });
  const sent = navigator.sendBeacon?.("/api/track/concert", new Blob([body], { type: "application/json" }));
  if (!sent) {
    fetch("/api/track/concert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}
