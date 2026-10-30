import "server-only";
import { getConcerts, readStoredConcerts } from "@/lib/concerts/source";
import { upcomingConcerts } from "@/lib/concerts";
import { kv } from "@/lib/kv";
import { sendToTopic, type PushPayload, type SendResult } from "@/lib/push/send";
import { formatReleaseDate, releaseTypeLabel } from "@/lib/release/format";
import { releaseSlug } from "@/lib/release/slug";
import { fetchFreshReleases } from "@/lib/spotify/catalog-service";

/**
 * Yeni sürüm / yeni konser tespiti ve bildirim gönderimi.
 *
 * - Tespit: Spotify'dan taze sürüm listesi ve KV'deki konserler, "bilinenler" kümesiyle karşılaştırılır.
 *   Küme ilk kez doluyorsa mevcutlar SESSİZCE bilinen yapılır (eski içerik için bildirim yağmaz).
 * - Gönderim yalnızca 09:00–22:00 (TR) arasında yapılır; gece gelen olaylar kuyrukta bekler.
 * - Aynı olay iki kez gönderilmez (bilinenler kümesi + kuyruk tek seferlik boşaltılır).
 */
const KNOWN_RELEASES = "sehinsah:push:known:releases";
const KNOWN_CONCERTS = "sehinsah:push:known:concerts";
const QUEUE = "sehinsah:push:queue";
const NOTIFY_LOCK = "sehinsah:push:notify-lock";

/** Çok eski bir sürüm (ör. yeniden yükleme) "yeni parça" olarak duyurulmasın. */
const RELEASE_MAX_AGE_DAYS = 21;
const QUIET_FROM = 22;
const QUIET_TO = 9;
const MAX_INDIVIDUAL = 3;

type QueuedEvent = { id: string; topic: "releases" | "concerts"; payload: PushPayload };

const trHour = (now: number) => new Date(now + 3 * 60 * 60 * 1000).getUTCHours();

export function isQuietHours(now: number = Date.now()): boolean {
  const hour = trHour(now);
  return hour >= QUIET_FROM || hour < QUIET_TO;
}

async function detectReleases(now: number): Promise<{ events: QueuedEvent[]; initialized: boolean }> {
  if (!kv) return { events: [], initialized: false };
  const fresh = await fetchFreshReleases();
  if (!fresh.length) return { events: [], initialized: false };

  const known = new Set((await kv.smembers(KNOWN_RELEASES)) as string[]);
  if (known.size === 0) {
    await kv.sadd(KNOWN_RELEASES, fresh[0].id, ...fresh.slice(1).map((r) => r.id));
    return { events: [], initialized: true };
  }

  const events: QueuedEvent[] = [];
  const newIds: string[] = [];
  for (const release of fresh) {
    if (known.has(release.id)) continue;
    newIds.push(release.id);

    const ageDays = (now - Date.parse(release.releaseDate)) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays > RELEASE_MAX_AGE_DAYS) continue; // eski içerik: sessizce bilinen yap

    const type = releaseTypeLabel(release);
    const others = release.artists.filter((a) => a.id !== release.artists[0]?.id).map((a) => a.name);
    events.push({
      id: `release:${release.id}`,
      topic: "releases",
      payload: {
        title: type === "Tekli" ? "Yeni parça" : `Yeni ${type.toLowerCase()}`,
        body: `${release.name}${others.length ? ` (ft. ${others.join(", ")})` : ""} şimdi yayında. Dinle ve klibi izle.`,
        url: `/muzik/${releaseSlug(release, fresh)}`,
        tag: `release-${release.id}`,
        ...(release.imageUrl ? { image: release.imageUrl } : {}),
      },
    });
  }

  if (newIds.length) await kv.sadd(KNOWN_RELEASES, newIds[0], ...newIds.slice(1));
  return { events, initialized: false };
}

async function detectConcerts(now: number): Promise<{ events: QueuedEvent[]; initialized: boolean }> {
  if (!kv) return { events: [], initialized: false };
  const stored = await readStoredConcerts().catch(() => null);
  const list = upcomingConcerts(stored?.concerts ?? (await getConcerts()), now);
  if (!list.length) return { events: [], initialized: false };

  const known = new Set((await kv.smembers(KNOWN_CONCERTS)) as string[]);
  if (known.size === 0) {
    await kv.sadd(KNOWN_CONCERTS, list[0].id, ...list.slice(1).map((c) => c.id));
    return { events: [], initialized: true };
  }

  const fresh = list.filter((c) => !known.has(c.id));
  if (!fresh.length) return { events: [], initialized: false };

  const events: QueuedEvent[] = fresh.map((c) => ({
    id: `concert:${c.id}`,
    topic: "concerts",
    payload: {
      title: "Yeni konser",
      body: `${c.title} — ${formatReleaseDate(c.startsAt.slice(0, 10))}, ${c.city} · ${c.venue}`,
      url: "/#takvim",
      tag: `concert-${c.id}`,
    },
  }));
  await kv.sadd(KNOWN_CONCERTS, fresh[0].id, ...fresh.slice(1).map((c) => c.id));
  return { events, initialized: false };
}

export type NotifySummary = {
  ok: boolean;
  quiet: boolean;
  detected: number;
  initialized: string[];
  queued: number;
  sent: SendResult | null;
  note?: string;
};

/** Yinelenen çağrılar zararsızdır: 5 dk kilit, başarıda 25 dk daha bekleme. */
export async function runNotify(options: { force?: boolean } = {}): Promise<NotifySummary> {
  const empty: NotifySummary = { ok: true, quiet: false, detected: 0, initialized: [], queued: 0, sent: null };
  if (!kv) return { ...empty, ok: false, note: "kv_not_configured" };

  if (!options.force) {
    const got = await kv.set(NOTIFY_LOCK, String(Date.now()), { nx: true, ex: 300 });
    if (got !== "OK") return { ...empty, note: "recently_ran" };
  }

  const now = Date.now();
  const initialized: string[] = [];
  const found: QueuedEvent[] = [];

  try {
    const releases = await detectReleases(now);
    if (releases.initialized) initialized.push("releases");
    found.push(...releases.events);
  } catch (error) {
    console.error("[notify] release detection failed:", error instanceof Error ? error.message : error);
  }
  try {
    const concerts = await detectConcerts(now);
    if (concerts.initialized) initialized.push("concerts");
    found.push(...concerts.events);
  } catch (error) {
    console.error("[notify] concert detection failed:", error instanceof Error ? error.message : error);
  }

  for (const event of found) await kv.rpush(QUEUE, JSON.stringify(event));

  const quiet = isQuietHours(now);
  const summary: NotifySummary = { ...empty, quiet, detected: found.length, initialized };

  const pending = ((await kv.lrange(QUEUE, 0, -1)) as unknown[]).map((raw) =>
    (typeof raw === "string" ? JSON.parse(raw) : raw) as QueuedEvent,
  );
  summary.queued = pending.length;

  if (quiet || pending.length === 0) {
    if (!options.force) await kv.expire(NOTIFY_LOCK, quiet ? 60 : 1500);
    return summary;
  }

  // Önce kuyruğu boşalt (aynı olay iki kez gitmesin), sonra gönder.
  await kv.del(QUEUE);

  const total: SendResult = { sent: 0, removed: 0, failed: 0 };
  const add = (r: SendResult) => {
    total.sent += r.sent;
    total.removed += r.removed;
    total.failed += r.failed;
  };

  try {
    if (pending.length > MAX_INDIVIDUAL) {
      // Birikmiş çok olay: tek özet bildirim (spam olmasın).
      for (const topic of ["releases", "concerts"] as const) {
        const items = pending.filter((e) => e.topic === topic);
        if (!items.length) continue;
        add(
          await sendToTopic(topic, {
            title: topic === "releases" ? "Yeni yayınlar" : "Yeni konserler",
            body: `${items.length} yeni gelişme var. Detaylar sitede.`,
            url: topic === "releases" ? "/#muzik" : "/#takvim",
            tag: `${topic}-summary`,
          }),
        );
      }
    } else {
      for (const event of pending) add(await sendToTopic(event.topic, event.payload));
    }
    summary.sent = total;
    summary.queued = 0;
  } catch (error) {
    // Gönderim başarısız: olayları kuyruğa geri koy (sonraki çalışmada tekrar denenir).
    for (const event of pending) await kv.rpush(QUEUE, JSON.stringify(event));
    summary.ok = false;
    summary.note = error instanceof Error ? error.message : String(error);
  }

  if (!options.force) await kv.expire(NOTIFY_LOCK, 1500);
  return summary;
}
