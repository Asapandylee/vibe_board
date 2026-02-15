import "server-only";
import type { Emotion } from "@/lib/supabase/types";

export type MusicTrack = {
  title: string;
  url: string;
  duration: number;
};

// 감정별 Pixabay 음악 검색 키워드 폴백
const EMOTION_MUSIC_FALLBACK: Record<
  Emotion,
  { query: string; genre: string }
> = {
  joy: { query: "happy upbeat", genre: "pop" },
  sadness: { query: "sad piano", genre: "ambient" },
  anger: { query: "intense dramatic", genre: "electronic" },
  anxiety: { query: "calm soothing", genre: "ambient" },
  peace: { query: "gentle relaxing", genre: "classical" },
  excitement: { query: "energetic uplifting", genre: "pop" },
  gratitude: { query: "warm acoustic", genre: "folk" },
};

/**
 * Pixabay Music API로 로열티프리 음악 검색
 */
export async function searchMusic(
  keyword: string,
  emotion: Emotion,
): Promise<MusicTrack | null> {
  const apiKey = process.env.PIXABAY_API_KEY;

  if (apiKey) {
    try {
      const searchQuery = encodeURIComponent(keyword);
      const res = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&q=${searchQuery}&media_type=music&per_page=5&safesearch=true`,
        { next: { revalidate: 3600 } },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.hits && data.hits.length > 0) {
          // 랜덤으로 하나 선택 (다양성 제공)
          const track = data.hits[Math.floor(Math.random() * data.hits.length)];
          return {
            title: track.tags || keyword,
            url: track.previewURL || track.audio,
            duration: track.duration || 0,
          };
        }
      }
    } catch (error) {
      console.error("Pixabay Music API error:", error);
    }
  }

  // Pixabay 실패 시 폴백: 감정별 기본 앰비언트 트랙
  return getAmbientFallback(emotion);
}

/**
 * 내장 앰비언트 폴백 (Pixabay API 없이도 동작)
 * 실제 구현 시 public/audio/ 에 CC0 음원 포함
 */
function getAmbientFallback(emotion: Emotion): MusicTrack | null {
  const fallback = EMOTION_MUSIC_FALLBACK[emotion];

  // 폴백으로 감정에 맞는 메타 정보만 반환 (클라이언트 측에서 처리)
  return {
    title: `${fallback.genre} - ${fallback.query}`,
    url: "", // 음원 URL 없음 — 클라이언트에서 Web Audio 앰비언트 사용
    duration: 0,
  };
}
