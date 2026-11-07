import { NextResponse } from "next/server";
import { recordClick } from "@/lib/concerts/clicks";
import { getConcerts } from "@/lib/concerts/source";
import type { ConcertAction } from "@/lib/concerts/track";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const ACTIONS: ConcertAction[] = ["ticket", "calendar", "maps", "share"];
const VISITOR_ID = /^[0-9a-f-]{36}$/;

const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  if (await isRateLimited(`concert-click:${clientIp(request)}`, 30, 60)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = ACTIONS.find((a) => a === body?.action);
  if (!action || typeof body?.id !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const concert = (await getConcerts()).find((c) => c.id === body.id);
  if (!concert) return done();

  const visitor = typeof body.visitor === "string" && VISITOR_ID.test(body.visitor) ? body.visitor : "";
  await recordClick(concert, action, visitor);
  return done();
}
