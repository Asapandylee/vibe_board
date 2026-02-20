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

type RankedVideo = YoutubeTrack & {
  score: number;
};

const OFFICIAL_TITLE_PATTERNS = [
  "official mv",
  "official music video",
  "official video",
  "official",
  "뮤직비디오",
  "m/v",
  "(mv)",
];

const LOW_PRIORITY_TITLE_PATTERNS = [
  "lyrics",
  "lyric",
  "audio",
  "teaser",
  "shorts",
  "reaction",
  "cover",
  "fanmade",
  "fan made",
  "instrumental",
  "karaoke",
];

function scoreVideoCandidate(input: {
  title?: string;
  channelName?: string;
  isVerified?: boolean;
}): number {
  const title = (input.title ?? "").toLowerCase();
  const channelName = (input.channelName ?? "").toLowerCase();

  let score = 0;

  for (const pattern of OFFICIAL_TITLE_PATTERNS) {
    if (title.includes(pattern)) score += 25;
  }

  for (const pattern of LOW_PRIORITY_TITLE_PATTERNS) {
    if (title.includes(pattern)) score -= 30;
  }

  if (channelName.includes("official")) score += 15;
  if (input.isVerified) score += 10;

  return score;
}

/**
 * YouTube 검색 페이지 파싱으로 실시간 검색 (API 키 불필요)
 */
async function searchYouTubeVideo(keyword: string): Promise<YoutubeTrack | null> {
  try {
    const query = encodeURIComponent(`${keyword} official mv`);
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

    const data = JSON.parse(raw) as {
      contents?: {
        twoColumnSearchResultsRenderer?: {
          primaryContents?: {
            sectionListRenderer?: {
              contents?: Array<{
                itemSectionRenderer?: {
                  contents?: unknown[];
                };
              }>;
            };
          };
        };
      };
    };
    const contents: unknown[] =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ??
      [];

    const ranked: RankedVideo[] = [];

    for (const item of contents) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("videoRenderer" in item)
      ) {
        continue;
      }

      const vr = (item as { videoRenderer: Record<string, unknown> })
        .videoRenderer;
      const videoId = vr.videoId;
      if (typeof videoId !== "string" || !videoId) continue;

      const titleRuns = (vr.title as { runs?: Array<{ text?: string }> })?.runs;
      const ownerRuns = (
        vr.ownerText as { runs?: Array<{ text?: string }> }
      )?.runs;
      const ownerBadges = vr.ownerBadges as Array<{
        metadataBadgeRenderer?: { style?: string };
      }> | undefined;

      const title = titleRuns?.[0]?.text ?? keyword;
      const channelName = ownerRuns?.[0]?.text ?? "";
      const isVerified =
        ownerBadges?.some((badge) =>
          badge?.metadataBadgeRenderer?.style?.includes("VERIFIED"),
        ) ?? false;

      ranked.push({
        id: videoId,
        title,
        score: scoreVideoCandidate({ title, channelName, isVerified }),
      });
    }

    if (!ranked.length) return null;

    ranked.sort((a, b) => b.score - a.score);
    return { id: ranked[0].id, title: ranked[0].title };
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
