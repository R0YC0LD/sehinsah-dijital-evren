import "server-only";
import type { Comment } from "@/lib/comments/types";

/**
 * Geçici bellek-içi depo. Vercel serverless fonksiyonları kalıcı disk
 * tutmadığı için bu veriler yeniden dağıtımda/soğuk başlatmada silinir.
 * Kalıcı hale getirmek için burayı gerçek bir veritabanına (Supabase,
 * Vercel KV vb.) bağlamak gerekir.
 */
const globalStore = globalThis as unknown as { __sehinsahComments?: Comment[] };
if (!globalStore.__sehinsahComments) globalStore.__sehinsahComments = [];

export function listComments(productId: string): Comment[] {
  return globalStore
    .__sehinsahComments!.filter((c) => c.productId === productId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addComment(input: { productId: string; name: string; text: string }): Comment {
  const comment: Comment = {
    id: crypto.randomUUID(),
    productId: input.productId,
    name: input.name,
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  globalStore.__sehinsahComments!.push(comment);
  return comment;
}
