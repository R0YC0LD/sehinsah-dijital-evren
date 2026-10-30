import { NextResponse } from "next/server";
import { runNotify } from "@/lib/push/events";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Yeni sürüm / yeni konser tespit edip abonelere bildirim gönderir (yalnızca 09:00–22:00 TR).
 * GitHub Action günde 4 kez, konser cron'u da her çalışmasında çağırır. Herkese açık çağrılsa da
 * zararsızdır: yalnızca GERÇEK yeni olayları duyurur, 5 dk kilit + başarıda 25 dk bekleme vardır.
 * İsteğe bağlı: CRON_SECRET tanımlıysa Authorization: Bearer ister.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runNotify();
    return NextResponse.json(summary, { status: summary.ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/notify]", message);
    return NextResponse.json({ ok: false, error: "failed", detail: message }, { status: 500 });
  }
}
