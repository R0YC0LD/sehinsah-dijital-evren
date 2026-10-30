/**
 * Şarkı sözleri — Spotify API söz vermez ve sözler telif kapsamındadır; bu yüzden
 * otomatik çekilmez. Yayın hakkın/izin varsa buraya Spotify PARÇA ID'sine göre ekle:
 *
 *   "57nmhwF2m4de6U9SK6SEC2": { text: `satır 1\nsatır 2`, credit: "Söz: ..." },
 *
 * Parça sayfasında söz alanı yalnızca burada kayıt varsa metni gösterir;
 * yoksa "Spotify'da sözlerle dinle" bağlantısı görünür.
 */
export type LyricsEntry = {
  text: string;
  credit?: string;
};

export const lyrics: Record<string, LyricsEntry> = {};
