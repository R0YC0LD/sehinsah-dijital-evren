/**
 * Konser takvimi. Yeni etkinlik eklemek için diziye bir obje ekle; tarihi geçen
 * etkinlikler sitede otomatik gizlenir.
 *
 * Kaynak: Bubilet etkinlik sayfaları (fiyat sabit yazılmaz, güncel fiyat Bubilet'te).
 * `startsAt`: Türkiye saatiyle ISO (+03:00).
 */
export type Concert = {
  id: string;
  title: string;
  /** Çok sanatçılı gecelerde kısa açıklama. */
  lineup?: string[];
  startsAt: string;
  doorsAt?: string;
  city: string;
  venue: string;
  ticketUrl: string;
  ageLimit?: string;
  soldOut?: boolean;
};

export const concerts: Concert[] = [
  {
    id: "hiphop-operation-istanbul-2026-11-17",
    title: "HipHop Operation",
    lineup: ["Allame", "Aspova", "Hidra", "Şehinşah", "Lab Gang"],
    startsAt: "2026-11-17T21:30:00+03:00",
    city: "İstanbul",
    venue: "Dorock XL Kadıköy",
    ticketUrl: "https://www.bubilet.com.tr/istanbul/etkinlik/hiphop-operation/seans/301205",
    ageLimit: "18+",
  },
  {
    id: "sehinsah-konseri-ankara-2026-12-18",
    title: "Şehinşah Konseri",
    startsAt: "2026-12-18T22:00:00+03:00",
    doorsAt: "2026-12-18T21:00:00+03:00",
    city: "Ankara",
    venue: "Holly Stone Performance Hall",
    ticketUrl: "https://www.bubilet.com.tr/ankara/etkinlik/sehinsah-konseri-/seans/304248",
    ageLimit: "18+",
  },
];
