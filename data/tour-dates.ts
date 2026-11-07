import type { Concert } from "@/data/concerts";

type TourDate = {
  date: string;
  city: string;
  venue: string;
  ageLimit?: string;
  country?: string;
};

/**
 * Tur afişinde olup Bubilet'te bulunmayan tarihler. Saat ve bilet bağlantısı yok; Bubilet'te aynı gün
 * bir etkinlik görününce o kayıt bunun yerine geçer (lib/concerts/source.ts).
 */
const POSTER: TourDate[] = [
  { date: "2027-01-24", city: "İstanbul", venue: "Hayal Kahvesi Bahçeşehir", ageLimit: "18+" },
];

/** Saat bilinmediği için 21:00 yalnızca sıralama ve tarihi geçince gizleme içindir; arayüzde gösterilmez. */
export const tourConcerts: Concert[] = POSTER.map(({ date, ...rest }) => ({
  id: `tur-${date}`,
  title: "Şehinşah Konseri",
  startsAt: `${date}T21:00:00+03:00`,
  timeTba: true,
  ticketUrl: "",
  ...rest,
}));
