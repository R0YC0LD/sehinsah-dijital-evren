import { NextResponse } from "next/server";
import { getVapid } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";

/** Tarayıcının abonelik oluştururken kullanacağı VAPID ortak (public) anahtarı. */
export async function GET() {
  try {
    const vapid = await getVapid();
    if (!vapid) return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
    return NextResponse.json({ publicKey: vapid.publicKey }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "push_unavailable" }, { status: 503 });
  }
}
