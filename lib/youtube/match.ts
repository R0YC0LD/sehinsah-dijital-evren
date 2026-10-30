import videos from "@/data/generated/youtube-videos.json";
import { trackVideoOverrides } from "@/data/track-videos";

type YouTubeVideo = { id: string; title: string };

/** Türkçe karakterleri sadeleştirip yalnızca harf/rakam bırakır: "70'lik" → "70lik". */
export function normalizeTitle(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

const SKIP_TITLE = /(live|canlı|vlog|documentary|belgesel|prova|konser|tour|duyuru|shorts)/i;

/** "Şehinşah ft. Hidra - Sodom&Gomore (Prod ...)" → ["sodom&gomore"] (normalize öncesi). */
function titleCandidates(title: string): string[] {
  if (title.includes("#") || SKIP_TITLE.test(title)) return [];
  let t = title
    .replace(/[([][^)\]]*[)\]]/g, " ")
    .replace(/\b(official\s+)?(lyric\s+)?(video|audio|clip|klip|visualizer)\b/gi, " ")
    .trim();
  t = t.replace(
    /^(şehinşah|sehinsah)(\s*(&|ft\.?|feat\.?|x)\s*[^|\-–:]+)?\s*[|\-–:]\s*/i,
    "",
  );
  const parts = t.split(/\s*\/\s*/).filter(Boolean);
  return [t, ...parts];
}

const index = new Map<string, string>();
for (const video of (videos as { videos: YouTubeVideo[] }).videos) {
  // Liste yeniden eskiye sıralı: aynı ad birden çok videoda varsa en yenisi kalır.
  for (const candidate of titleCandidates(video.title)) {
    const key = normalizeTitle(candidate);
    if (key && !index.has(key)) index.set(key, video.id);
  }
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
  const key = normalizeTitle(name);
  return key ? (index.get(key) ?? null) : null;
}
