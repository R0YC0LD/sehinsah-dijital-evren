import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { upcomingConcerts } from "@/lib/concerts";
import {
  StructureChanged,
  Unreachable,
  fetchBubiletConcerts,
} from "@/lib/concerts/bubilet.mjs";
import {
  acquireLock,
  getConcerts,
  holdLock,
  readStoredConcerts,
  redis,
  writeStoredConcerts,
} from "@/lib/concerts/source";
import type { Concert } from "@/data/concerts";

/**
 * Vercel Cron (vercel.json) bu rotayı günde 2 kez çağırır (01:30 ve 07:00 TR). Bubilet'teki
 * Şehinşah etkinliklerini okur, değişiklik varsa Upstash KV'ye yazar ve siteyi tazeler.
 * Hata durumunda mevcut veri korunur; yapı değişmişse hiçbir şey yazılmaz.
 *
 * Herkese açık çağrılsa da zararsızdır: 5 dk kilit + başarıda 30 dk bekleme, Bubilet'e yük bindirmez.
 * İsteğe bağlı: Vercel'de CRON_SECRET tanımlanırsa Authorization: Bearer ile korunur.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!redis) {
    return json({ ok: false, error: "kv_not_configured", hint: "KV_REST_API_URL / KV_REST_API_TOKEN tanımlı değil" }, 503);
  }
  if (!(await acquireLock(300))) {
    return json({ ok: true, skipped: "recently_ran" });
  }

  try {
    const stored = await readStoredConcerts().catch(() => null);
    const previous: Concert[] = stored?.concerts ?? (await getConcerts());

    const { concerts, sessions } = await fetchBubiletConcerts({ previous });
    const before = upcomingConcerts(previous, Date.now());
    const changed = !stored || JSON.stringify(concerts) !== JSON.stringify(before);

    if (changed) {
      await writeStoredConcerts(concerts as Concert[]);
      revalidateTag("concerts");
      revalidatePath("/", "layout");
    }
    await holdLock(1800);

    return json({
      ok: true,
      changed,
      sessions,
      upcoming: concerts.length,
      added: concerts.filter((c) => !before.some((b) => b.id === c.id)).map((c) => c.title),
      removed: before.filter((b) => !concerts.some((c) => c.id === b.id)).map((b) => b.title),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/concerts]", message);
    if (error instanceof Unreachable) return json({ ok: false, error: "bubilet_unreachable", detail: message }, 502);
    if (error instanceof StructureChanged) return json({ ok: false, error: "structure_changed", detail: message }, 502);
    return json({ ok: false, error: "failed", detail: message }, 500);
  }
}
