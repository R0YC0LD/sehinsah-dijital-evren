import "server-only";
import { Redis } from "@upstash/redis";
import type { Comment } from "@/lib/comments/types";

/**
 * Kalıcı depo: Upstash Redis (Vercel Storage üzerinden bağlanan KV_REST_API_*
 * değişkenleri mevcutsa). Bu değişkenler yoksa (ör. yerel geliştirme), geçici
 * bellek-içi depoya düşer — o veriler yeniden dağıtımda/soğuk başlatmada silinir.
 */
const HASH_KEY = "sehinsah:comments";
const indexKey = (productId: string) => `sehinsah:comments:idx:${productId}`;

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const globalStore = globalThis as unknown as { __sehinsahComments?: Comment[] };
if (!globalStore.__sehinsahComments) globalStore.__sehinsahComments = [];

function sortByDateDesc(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listComments(productId: string): Promise<Comment[]> {
  if (!redis) {
    return sortByDateDesc(globalStore.__sehinsahComments!.filter((c) => c.productId === productId));
  }

  const ids = await redis.lrange<string>(indexKey(productId), 0, -1);
  if (!ids.length) return [];
  const values = await redis.hmget<Record<string, Comment>>(HASH_KEY, ...ids);
  if (!values) return [];
  return ids.map((id) => values[id]).filter((c): c is Comment => Boolean(c));
}

export async function addComment(input: {
  productId: string;
  name: string;
  text: string;
}): Promise<Comment> {
  const comment: Comment = {
    id: crypto.randomUUID(),
    productId: input.productId,
    name: input.name,
    text: input.text,
    createdAt: new Date().toISOString(),
  };

  if (!redis) {
    globalStore.__sehinsahComments!.push(comment);
    return comment;
  }

  await redis.hset(HASH_KEY, { [comment.id]: JSON.stringify(comment) });
  await redis.lpush(indexKey(comment.productId), comment.id);
  return comment;
}

export async function listAllComments(productIds: string[]): Promise<Comment[]> {
  if (!redis) {
    return sortByDateDesc(globalStore.__sehinsahComments!);
  }

  const perProduct = await Promise.all(productIds.map((id) => listComments(id)));
  return sortByDateDesc(perProduct.flat());
}

export async function deleteComment(id: string): Promise<boolean> {
  if (!redis) {
    const arr = globalStore.__sehinsahComments!;
    const idx = arr.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    return true;
  }

  const existing = await redis.hget<Comment>(HASH_KEY, id);
  if (!existing) return false;
  await redis.hdel(HASH_KEY, id);
  await redis.lrem(indexKey(existing.productId), 0, id);
  return true;
}
