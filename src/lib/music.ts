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
 * 감정별 큐레이션 YouTube 영상 목록
 * - 분위기에 맞는 대표 곡들로 구성
 * - keyword를 seed 삼아 매번 다른 곡 선택 (다양성 확보)
 */
const EMOTION_MUSIC: Record<Emotion, YoutubeTrack[]> = {
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
    { id: "CvBfHwUxHIk", title: "The Night We Met – Lord Huron" },
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
    { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio – Beats to Relax" },
    { id: "5qap5aO4i9A", title: "Lofi Hip Hop – Chill Beats to Study" },
  ],
  peace: [
    { id: "CgyJV_UVHWA", title: "Comptine d'un autre été – Yann Tiersen" },
    { id: "Bvnkt9BbAGE", title: "Clair de Lune – Debussy" },
    { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio – Study / Relax" },
    { id: "2OEL4P1Rz04", title: "Peaceful Piano – Relaxing Music" },
  ],
  excitement: [
    { id: "HgzGwKwLmgM", title: "Don't Stop Me Now – Queen" },
    { id: "I4YDBMkLDUI", title: "Eye of the Tiger – Survivor" },
    { id: "gCYcHz2k5x0", title: "Thunderstruck – AC/DC" },
    { id: "btPJPFnesV4", title: "Bohemian Rhapsody – Queen" },
  ],
  gratitude: [
    { id: "CgyJV_UVHWA", title: "Comptine d'un autre été – Yann Tiersen" },
    { id: "NAwsRd7GZLM", title: "Experience – Ludovico Einaudi" },
    { id: "Bvnkt9BbAGE", title: "Clair de Lune – Debussy" },
    { id: "_E0PWQvW-zo", title: "La Vie en Rose – Édith Piaf" },
  ],
};

/**
 * 감정 기반 YouTube 음악 선택
 * keyword를 seed로 활용해 동일 감정 내에서도 다양한 곡 제공
 */
export async function searchMusic(
  keyword: string,
  emotion: Emotion,
): Promise<MusicTrack | null> {
  const tracks = EMOTION_MUSIC[emotion] ?? EMOTION_MUSIC.peace;

  // keyword 문자열을 단순 해시로 변환 → 재생 목록에서 랜덤 선택
  const hash = keyword.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const track = tracks[hash % tracks.length];

  return {
    title: track.title,
    url: `https://www.youtube.com/embed/${track.id}`,
  };
}
