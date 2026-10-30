import { NextResponse } from "next/server";
import {
  MAX_SUBSCRIBERS,
  countSubscribers,
  getSubscription,
  parseSubscription,
  parseTopics,
  saveSubscription,
} from "@/lib/push/store";
import { kv } from "@/lib/kv";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Bildirim aboneliği oluşturur/günceller (konu tercihleriyle). */
export async function POST(request: Request) {
  if (!kv) return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  if (await isRateLimited(`push-sub:${clientIp(request)}`, 12, 60)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { subscription, topics } = (body ?? {}) as { subscription?: unknown; topics?: unknown };
  const sub = parseSubscription(subscription);
  if (!sub) return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });

  const parsedTopics = parseTopics(topics);
  if (!parsedTopics.releases && !parsedTopics.concerts) {
    return NextResponse.json({ error: "no_topics" }, { status: 400 });
  }

  if (!(await getSubscription(sub.endpoint)) && (await countSubscribers()) >= MAX_SUBSCRIBERS) {
    return NextResponse.json({ error: "capacity" }, { status: 503 });
  }

  await saveSubscription(sub, parsedTopics);
  return NextResponse.json({ ok: true, topics: parsedTopics });
}
