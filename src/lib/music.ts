import "server-only";
import type { Emotion } from "@/lib/supabase/types";

export type MusicTrack = {
  title: string;
  url: string; // YouTube embed URL
};

type YoutubeTrack = {
  id: string;
  title: string;
};

/**
 * YouTube 검색 페이지 파싱으로 실시간 검색 (API 키 불필요)
 */
async function searchYouTubeVideo(keyword: string): Promise<YoutubeTrack | null> {
  try {
    const query = encodeURIComponent(`${keyword} official`);
    const url = `https://www.youtube.com/results?search_query=${query}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 600 }, // 10분 캐시
    });

    if (!res.ok) return null;

    const html = await res.text();
    const raw = html.split("ytInitialData = ")[1]?.split(";</script>")[0];
    if (!raw) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = JSON.parse(raw);
    const contents: unknown[] =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ??
      [];

    // 첫 번째 videoRenderer 결과 사용
    const video = contents.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c): c is { videoRenderer: any } =>
        typeof c === "object" && c !== null && "videoRenderer" in c,
    );

    if (!video?.videoRenderer) return null;

    const vr = video.videoRenderer;
    return {
      id: vr.videoId as string,
      title: (vr.title?.runs?.[0]?.text ?? keyword) as string,
    };
  } catch {
    return null;
  }
}

/**
 * 감정별 큐레이션 폴백 목록 (YouTube 검색 실패 시 사용)
 */
const EMOTION_FALLBACK: Record<Emotion, YoutubeTrack[]> = {
  joy: [
    { id: "ZbZSe6N_BXs", title: "Happy – Pharrell Williams" },
    { id: "fHI8X4OXluQ", title: "Can't Stop the Feeling! – Justin Timberlake" },
    { id: "OPf0YbXqDm0", title: "Uptown Funk – Mark Ronson ft. Bruno Mars" },
    { id: "y6Sxv-sUYtM", title: "Walking on Sunshine – Katrina and the Waves" },
  ],
  sadness: [
    { id: "hLQl3WQQoQ0", title: "Someone Like You – Adele" },
    { id: "k4V3Mo61fJM", title: "Fix You – Coldplay" },
    { id: "RBumgq5yVrA", title: "Let Her Go – Passenger" },
    { id: "etSbOs3aUqI", title: "Mad World – Gary Jules" },
  ],
  anger: [
    { id: "kXYiU_JCYtU", title: "Numb – Linkin Park" },
    { id: "eVTXPUF4Oz4", title: "In The End – Linkin Park" },
    { id: "I4YDBMkLDUI", title: "Eye of the Tiger – Survivor" },
    { id: "dGFSjKuJfrI", title: "Break Stuff – Limp Bizkit" },
  ],
  anxiety: [
    { id: "UfcAVejslrU", title: "Weightless – Marconi Union" },
    { id: "77ZozI0rw7w", title: "Breathe – Pink Floyd" },
    { id: "ghPcYqn0p4Y", title: "Breathe Me – Sia" },
    { id: "7wfYIMyS_dI", title: "Only Time – Enya" },
  ],
  peace: [
    { id: "CgyJV_UVHWA", title: "Comptine d'un autre été – Yann Tiersen" },
    { id: "Bvnkt9BbAGE", title: "Clair de Lune – Debussy" },
    { id: "7maJOI3QMu0", title: "River Flows in You – Yiruma" },
    { id: "imGaOIm5HOk", title: "Kiss the Rain – Yiruma" },
  ],
  excitement: [
    { id: "HgzGwKwLmgM", title: "Don't Stop Me Now – Queen" },
    { id: "gCYcHz2k5x0", title: "Thunderstruck – AC/DC" },
    { id: "btPJPFnesV4", title: "Bohemian Rhapsody – Queen" },
    { id: "fJ9rUzIMcZQ", title: "Don't Stop Believin' – Journey" },
  ],
  gratitude: [
    { id: "NAwsRd7GZLM", title: "Experience – Ludovico Einaudi" },
    { id: "CgyJV_UVHWA", title: "Comptine d'un autre été – Yann Tiersen" },
    { id: "Bvnkt9BbAGE", title: "Clair de Lune – Debussy" },
    { id: "_E0PWQvW-zo", title: "La Vie en Rose – Édith Piaf" },
  ],
};

/**
 * 감정 기반 음악 추천
 * 1순위: Gemini가 생성한 keyword로 YouTube 실시간 검색
 * 2순위: 큐레이션 폴백 목록에서 랜덤 선택
 */
export async function searchMusic(
  keyword: string,
  emotion: Emotion,
): Promise<MusicTrack | null> {
  // 1. 실시간 YouTube 검색
  const liveResult = await searchYouTubeVideo(keyword);
  if (liveResult) {
    return {
      title: liveResult.title,
      url: `https://www.youtube.com/embed/${liveResult.id}`,
    };
  }

  // 2. 검색 실패 시 큐레이션 폴백
  const tracks = EMOTION_FALLBACK[emotion] ?? EMOTION_FALLBACK.peace;
  const track = tracks[Math.floor(Math.random() * tracks.length)];
  return {
    title: track.title,
    url: `https://www.youtube.com/embed/${track.id}`,
  };
}
