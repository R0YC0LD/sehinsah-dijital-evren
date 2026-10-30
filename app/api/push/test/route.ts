import { NextResponse } from "next/server";
import { sendToSubscription } from "@/lib/push/send";
import { getSubscription, removeSubscription } from "@/lib/push/store";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Kullanıcı kendi cihazına bir test bildirimi gönderebilir (başka aboneliğe gönderilemez). */
export async function POST(request: Request) {
  if (await isRateLimited(`push-test:${clientIp(request)}`, 4, 3600)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const endpoint = (body as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== "string") return NextResponse.json({ error: "invalid_endpoint" }, { status: 400 });

  const stored = await getSubscription(endpoint);
  if (!stored) return NextResponse.json({ error: "not_subscribed" }, { status: 404 });

  try {
    const outcome = await sendToSubscription(stored.sub, {
      title: "Bildirimler açık",
      body: "Yeni parça ve konser çıkınca buradan haber vereceğiz.",
      url: "/",
      tag: "test",
    });
    if (outcome === "removed") {
      await removeSubscription(endpoint);
      return NextResponse.json({ error: "subscription_expired" }, { status: 410 });
    }
    return NextResponse.json({ ok: outcome === "sent" }, { status: outcome === "sent" ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  }
}
