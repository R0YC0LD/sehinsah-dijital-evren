/**
 * Konser verisi tipi. Canlı veri: Vercel cron (app/api/cron/concerts) Bubilet'ten günde 2 kez
 * okuyup Upstash KV'ye yazar (lib/concerts/source.ts). Yedek/anlık görüntü:
 * data/generated/concerts.json (`npm run sync:concerts`). ELLE DÜZENLEME GEREKMEZ.
 */
export type Concert = {
  id: string;
  title: string;
  /** Türkiye saatiyle ISO (+03:00). */
  startsAt: string;
  doorsAt?: string;
  city: string;
  venue: string;
  ticketUrl: string;
  ageLimit?: string;
  soldOut?: boolean;
};
