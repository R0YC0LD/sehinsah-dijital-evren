import "server-only";

import type { Concert } from "@/data/concerts";
import { kv } from "@/lib/kv";
import type { ConcertAction } from "@/lib/concerts/track";

const PREFIX = "sehinsah:clicks:v1";
const RECENT_LIMIT = 20;

export type ConcertClickRow = {
  id: string;
  title: string;
  city: string;
  venue: string;
  startsAt: string;
  ticket: number;
  calendar: number;
  maps: number;
  share: number;
  visitors: number;
};

export type RecentClick = { id: string; city: string; action: ConcertAction; at: string };

export type ClickStats = {
  rows: ConcertClickRow[];
  recent: RecentClick[];
  totalVisitors: number;
};

export async function recordClick(concert: Concert, action: ConcertAction, visitor: string): Promise<void> {
  if (!kv) return;
  const recent: RecentClick = { id: concert.id, city: concert.city, action, at: new Date().toISOString() };
  const pipe = kv.pipeline();
  pipe.sadd(`${PREFIX}:ids`, concert.id);
  pipe.hincrby(`${PREFIX}:concert:${concert.id}`, action, 1);
  pipe.hset(`${PREFIX}:concert:${concert.id}`, {
    title: concert.title,
    city: concert.city,
    venue: concert.venue,
    startsAt: concert.startsAt,
  });
  if (visitor) {
    pipe.pfadd(`${PREFIX}:visitors:${concert.id}`, visitor);
    pipe.pfadd(`${PREFIX}:visitors`, visitor);
  }
  pipe.lpush(`${PREFIX}:recent`, JSON.stringify(recent));
  pipe.ltrim(`${PREFIX}:recent`, 0, RECENT_LIMIT - 1);
  await pipe.exec();
}

export async function readClickStats(): Promise<ClickStats> {
  if (!kv) return { rows: [], recent: [], totalVisitors: 0 };

  const ids = await kv.smembers(`${PREFIX}:ids`);
  const [recent, totalVisitors] = await Promise.all([
    kv.lrange<RecentClick>(`${PREFIX}:recent`, 0, RECENT_LIMIT - 1),
    kv.pfcount(`${PREFIX}:visitors`),
  ]);
  if (!ids.length) return { rows: [], recent, totalVisitors };

  const pipe = kv.pipeline();
  for (const id of ids) {
    pipe.hgetall(`${PREFIX}:concert:${id}`);
    pipe.pfcount(`${PREFIX}:visitors:${id}`);
  }
  const results = await pipe.exec<unknown[]>();

  const rows = ids.map((id, i) => {
    const hash = (results[i * 2] ?? {}) as Record<string, string | number>;
    return {
      id,
      title: String(hash.title ?? ""),
      city: String(hash.city ?? ""),
      venue: String(hash.venue ?? ""),
      startsAt: String(hash.startsAt ?? ""),
      ticket: Number(hash.ticket ?? 0),
      calendar: Number(hash.calendar ?? 0),
      maps: Number(hash.maps ?? 0),
      share: Number(hash.share ?? 0),
      visitors: Number(results[i * 2 + 1] ?? 0),
    };
  });
  rows.sort((a, b) => b.ticket - a.ticket || a.startsAt.localeCompare(b.startsAt));
  return { rows, recent, totalVisitors };
}
