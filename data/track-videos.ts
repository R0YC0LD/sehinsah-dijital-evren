/**
 * Parça sayfalarındaki klip eşleşmesini elle düzeltmek için.
 *
 * Normalde gerek yok: lib/youtube/match.ts, resmî kanalın video başlıklarını
 * (data/generated/youtube-videos.json) parça/albüm adıyla eşleştirir.
 *
 * Anahtar: Spotify albüm ID'si veya parça ID'si.
 * Değer:   YouTube video ID'si  → o videoyu zorla kullan
 *          null                 → bu sürümde klip gösterme (yanlış eşleşme varsa)
 */
export const trackVideoOverrides: Record<string, string | null> = {};
