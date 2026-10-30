import concertsFile from "@/data/generated/concerts.json";

/**
 * Konser takvimi verisi — ELLE DÜZENLEME: `scripts/sync-concerts.mjs` Bubilet'ten doldurur
 * (GitHub Action her gün 01:30, 07:00, 13:30, 19:30'da çalıştırır). Yeni etkinlik eklenir,
 * tarihi geçen/Bubilet'ten kalkan silinir. Kaynak: data/generated/concerts.json.
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

export const concerts: Concert[] = (concertsFile as { concerts: Concert[] }).concerts;
