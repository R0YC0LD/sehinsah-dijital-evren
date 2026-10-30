import overridesFile from "@/data/track-videos.json";
import videosFile from "@/data/generated/youtube-videos.json";
import { buildIndex, matchVideo } from "./matcher.mjs";

export { normalizeTitle } from "./matcher.mjs";

export type MatchContext = {
  /** Parçanın Spotify süresi (ms): videonun süresiyle doğrulanır. */
  durationMs?: number;
  /** Sürüm tarihi (YYYY-MM-DD): yeni videoların yayın tarihiyle doğrulanır. */
  releaseDate?: string;
};

const index = buildIndex(
  (videosFile as { videos: Array<{ id: string; title: string; durationSec?: number; published?: string }> }).videos,
);
const overrides = (overridesFile as { overrides: Record<string, string | null> }).overrides;

/**
 * Parça/albüm adına göre resmî kanaldaki klibi bulur. Ad eşleşmesi + süre/tarih doğrulaması
 * şarttır (lib/youtube/matcher.mjs); doğrulanamazsa null döner → klipsiz kapak sahnesi.
 * `ids`: elle override için Spotify ID'leri (data/track-videos.json).
 */
export function findVideoId(name: string, ids: string[] = [], ctx: MatchContext = {}): string | null {
  return matchVideo(index, name, ctx, { ids, overrides }).id;
}
