import videos from "@/data/generated/youtube-videos.json";
import { trackVideoOverrides } from "@/data/track-videos";

type YouTubeVideo = { id: string; title: string };

/** Türkçe karakterleri sadeleştirip yalnızca harf/rakam bırakır: "70'lik" → "70lik". */
export function normalizeTitle(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

const SKIP_TITLE = /(live|canlı|vlog|documentary|belgesel|prova|konser|tour|duyuru|shorts)/i;

/** "Şehinşah | X", "Şehinşah ft. Hidra - X", "Şehinşah & Archie | X" önekleri. */
const LEAD_ARTIST = /^(şehinşah|sehinsah)(\s*(&|ft\.?|feat\.?|x)\s*[^|\-–:]+)?\s*[|\-–:]\s*/i;
/** "Başka Sanatçı feat. Şehinşah - X" */
const GUEST_ARTIST = /^.+?\s+(?:ft\.?|feat\.?)\s+(?:şehinşah|sehinsah)\s*[|\-–:]\s*/i;
const TRAILING_FEAT = /\s+(?:ft\.?|feat\.?)\s+.*$/i;

type Candidate = { key: string; rank: number };

/**
 * Bir video başlığından olası parça adlarını çıkarır. Resmî düzendeki başlıklar
 * ("Şehinşah | X") rank 2, düz başlıklar rank 1 alır; aynı ad birden çok videoda
 * varsa daha yüksek rank (sonra daha yeni) kazanır.
 */
function titleCandidates(title: string): Candidate[] {
  if (title.includes("#") || SKIP_TITLE.test(title)) return [];

  let t = title
    .replace(/[([][^)\]]*[)\]]/g, " ")
    .replace(/\b(official\s+)?(lyric\s+)?(video|audio|clip|klip|visualizer)\b/gi, " ")
    .trim();

  let rank = 1;
  if (LEAD_ARTIST.test(t)) {
    t = t.replace(LEAD_ARTIST, "");
    rank = 2;
  } else if (GUEST_ARTIST.test(t)) {
    t = t.replace(GUEST_ARTIST, "");
    rank = 2;
  }
  t = t.replace(TRAILING_FEAT, "").trim();

  const parts = t.split(/\s*\/\s*/).filter(Boolean);
  return [t, ...parts].map((value) => ({ key: normalizeTitle(value), rank }));
}

const index = new Map<string, { id: string; rank: number }>();
for (const video of (videos as { videos: YouTubeVideo[] }).videos) {
  // Liste yeniden eskiye sıralı: eşit rank'te en yeni video kalır.
  for (const { key, rank } of titleCandidates(video.title)) {
    if (!key) continue;
    const existing = index.get(key);
    if (!existing || rank > existing.rank) index.set(key, { id: video.id, rank });
  }
}

/** Spotify adındaki "(feat. X)", "(with X)", "(prod. X)" eklerini atar; "(Deluxe Edition)" kalır. */
function cleanName(name: string): string {
  return name.replace(/\s*[([]\s*(?:feat|ft|with|prod)\b[^)\]]*[)\]]/gi, "").trim();
}

/**
 * Parça/albüm adına göre resmî kanaldaki klibi bulur. Sadece TAM başlık eşleşmesi
 * kabul edilir (yanlış videoyu otomatik oynatmaktansa klipsiz kalmak daha iyi).
 * `ids`: varsa elle override için Spotify ID'leri.
 */
export function findVideoId(name: string, ids: string[] = []): string | null {
  for (const id of ids) {
    if (id in trackVideoOverrides) return trackVideoOverrides[id];
  }
  const key = normalizeTitle(cleanName(name));
  return key ? (index.get(key)?.id ?? null) : null;
}
