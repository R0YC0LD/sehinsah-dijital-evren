/**
 * Bubilet'teki güncel konserleri data/generated/concerts.json (yedek/anlık görüntü) dosyasına yazar.
 *
 *   npm run sync:concerts
 *
 * Canlı sistem bunu kullanmaz: Vercel cron (app/api/cron/concerts) Bubilet'i günde 2 kez okuyup
 * Upstash KV'ye yazar. Bu script yerelden elle/zamanlanmış görev olarak çalıştırmak ve KV erişimi
 * olmadığında kullanılan yedek dosyayı güncel tutmak içindir. Okuma kuralları lib/concerts/bubilet.mjs'te.
 *
 * Çıkış kodları: 0 = tamam, 1 = sayfa yapısı değişti (hiçbir şey yazılmadı), 2 = Bubilet'e ulaşılamadı.
 * Değişiklik varsa GITHUB_OUTPUT'a `changed=true` yazar.
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { StructureChanged, Unreachable, fetchBubiletConcerts } from "../lib/concerts/bubilet.mjs";

const OUT = path.join(process.cwd(), "data", "generated", "concerts.json");

async function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main() {
  let previous = { schemaVersion: 1, source: "bubilet", updatedAt: null, concerts: [] };
  try {
    previous = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* ilk çalışma */
  }

  const { concerts, sessions } = await fetchBubiletConcerts({
    base: process.env.BUBILET_BASE || undefined,
    previous: previous.concerts,
  });
  console.log(`[concerts] Bubilet: ${sessions} seans`);

  const changed = JSON.stringify(concerts) !== JSON.stringify(previous.concerts);
  if (changed) {
    const out = { schemaVersion: 1, source: "bubilet", updatedAt: new Date().toISOString(), concerts };
    await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  }
  const added = concerts.filter((c) => !previous.concerts.some((p) => p.id === c.id)).length;
  const removed = previous.concerts.filter((c) => !concerts.some((n) => n.id === c.id)).length;
  console.log(
    `[concerts] ${concerts.length} yaklaşan konser — ${changed ? `güncellendi (+${added} / −${removed})` : "değişiklik yok"}`,
  );
  await setOutput("changed", String(changed));
}

main().catch(async (error) => {
  await setOutput("changed", "false");
  if (error instanceof Unreachable) {
    console.warn(`[concerts] Bubilet'e ulaşılamadı: ${error.message} — mevcut veri korunuyor.`);
    process.exit(2);
  }
  if (error instanceof StructureChanged) {
    console.error(`[concerts] HATA (yapı değişti): ${error.message}`);
    process.exit(1);
  }
  console.error("[concerts] HATA:", error.message || error);
  process.exit(1);
});
