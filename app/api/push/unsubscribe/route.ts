import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push/store";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Bildirim aboneliğini siler (endpoint'i bilen kişi kendi aboneliğini silebilir). */
export async function POST(request: Request) {
  if (await isRateLimited(`push-unsub:${clientIp(request)}`, 20, 60)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const endpoint = (body as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== "string" || endpoint.length > 1000) {
    return NextResponse.json({ error: "invalid_endpoint" }, { status: 400 });
  }

  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
