/**
 * Yeni ürün eklerken: görselleri public/media/store/<id>-1.jpg, <id>-2.jpg ...
 * şeklinde adlandırıp buradan sayısını ver, yol dizisini elle yazma.
 */
export function galleryImages(id: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/media/store/${id}-${i + 1}.jpg`);
}
