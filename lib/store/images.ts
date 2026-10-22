/**
 * Yeni ürün eklerken: görselleri public/media/store/<id>-1.webp, <id>-2.webp ...
 * (JPG/PNG koyduysan `npm run optimize:images` WebP'ye çevirir)
 * şeklinde adlandırıp buradan sayısını ver, yol dizisini elle yazma.
 */
export function galleryImages(id: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/media/store/${id}-${i + 1}.webp`);
}
