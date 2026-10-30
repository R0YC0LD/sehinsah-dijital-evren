import "server-only";
import webpush from "web-push";
import { kv } from "@/lib/kv";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Web Push (VAPID) anahtarları. Ortam değişkeni (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) varsa o
 * kullanılır; yoksa ilk kullanımda üretilip Upstash KV'ye yazılır — elle kurulum gerekmez.
 * KV'deki anahtar kaybolursa (silinirse) yeni anahtar üretilir ve ESKİ ABONELİKLER GEÇERSİZ olur.
 */
const KEY = "sehinsah:push:vapid";

export type Vapid = { publicKey: string; privateKey: string };

let cached: Vapid | null = null;

export async function getVapid(): Promise<Vapid | null> {
  if (cached) return cached;

  const envPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPublic && envPrivate) return (cached = { publicKey: envPublic, privateKey: envPrivate });

  if (!kv) return null;
  const existing = await kv.get<Vapid>(KEY);
  if (existing?.publicKey && existing?.privateKey) return (cached = existing);

  const keys = webpush.generateVAPIDKeys();
  const created = await kv.set(KEY, keys, { nx: true });
  if (created === "OK") return (cached = keys);

  // Başka bir istek aynı anda üretti: onunkini kullan.
  const winner = await kv.get<Vapid>(KEY);
  return winner?.publicKey && winner?.privateKey ? (cached = winner) : null;
}

/** web-push'u yapılandırır; anahtar yoksa false. */
export async function configureWebPush(): Promise<boolean> {
  const vapid = await getVapid();
  if (!vapid) return false;
  const siteUrl = getSiteUrl();
  const subject = process.env.VAPID_SUBJECT || (siteUrl.startsWith("https://") ? siteUrl : "https://sehinsah-dijital-evren.vercel.app");
  webpush.setVapidDetails(subject, vapid.publicKey, vapid.privateKey);
  return true;
}
