import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Aynı Upstash Redis bağlantısını (KV_REST_API_*) kullanır; yoksa
 * bellek-içi sayaça düşer. Bellek-içi sürüm tek bir serverless
 * instance'a özeldir, ama hiç limit olmamasından her zaman iyidir.
 */
const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const memoryHits = new Map<string, { count: number; resetAt: number }>();

export async function isRateLimited(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = Date.now();

  if (!redis) {
    const entry = memoryHits.get(key);
    if (!entry || entry.resetAt < now) {
      memoryHits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  }

  const redisKey = `sehinsah:ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return count > limit;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
