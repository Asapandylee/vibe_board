import "server-only";
import type { Emotion } from "@/lib/supabase/types";

export type MusicTrack = {
  title: string;
  url: string;
};

type MusicContext = {
  emotionScore?: number;
};

type YoutubeTrack = {
  id: string;
  title: string;
};

type RankedVideo = YoutubeTrack & {
  score: number;
};

type YouTubeVideoRenderer = {
  videoId?: string;
  title?: {
    runs?: Array<{ text?: string }>;
    simpleText?: string;
  };
  ownerText?: {
    runs?: Array<{ text?: string }>;
    simpleText?: string;
  };
  longBylineText?: {
    runs?: Array<{ text?: string }>;
  };
  publishedTimeText?: {
    simpleText?: string;
  };
  lengthText?: {
    simpleText?: string;
  };
  ownerBadges?: Array<{
    metadataBadgeRenderer?: {
      label?: {
        runs?: Array<{ text?: string }>;
      };
      style?: string;
    };
  }>;
};

const BLOCKED_TITLE_PATTERNS = [
  "playlist",
  "mix",
  "mixes",
  "radio",
  "album",
  "compilation",
  "best of",
  "best-of",
  "full album",
  "full-track album",
  "mega mix",
  "video mix",
  "playlist of",
  "재생목록",
  "믹스",
  "플레이리스트",
  "라디오",
  "오디오북",
];

const DISQUALIFY_TITLE_PATTERNS = [
  "lyrics",
  "lyric",
  "cover",
  "reaction",
  "fanmade",
  "fan made",
  "teaser",
  "trailer",
  "instrumental",
  "karaoke",
];

const OFFICIAL_TITLE_PATTERNS = [
  "official mv",
  "official music video",
  "official",
  "music video",
  "mv",
];

const OFFICIAL_CHANNEL_PATTERNS = ["official", "records", "music", "entertainment"];

const EMOTION_HINTS: Record<Emotion, readonly [string, string, string]> = {
  joy: ["upbeat", "bright", "feel good"],
  sadness: ["soft", "comforting", "deeply calming"],
  anger: ["calm", "steady", "breath reset"],
  anxiety: ["breathing", "soothing", "grounding"],
  peace: ["ambient", "serene", "piano"],
  excitement: ["uplifting", "energetic", "driving"],
  gratitude: ["warm", "hopeful", "comforting"],
};

const EMOTION_FALLBACK: Record<Emotion, readonly YoutubeTrack[]> = {
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

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeToNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeYouTubeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const record = value as { simpleText?: string; runs?: Array<{ text?: string }> };
  if (typeof record.simpleText === "string") return record.simpleText.trim();
  if (!Array.isArray(record.runs)) return "";
  return record.runs
    .map((run) => (typeof run.text === "string" ? run.text : ""))
    .join(" ")
    .trim();
}

function toLowerOrEmpty(value: string): string {
  return value.toLowerCase();
}

function hasAny(value: string, patterns: readonly string[]): boolean {
  const lowered = toLowerOrEmpty(value);
  return patterns.some((pattern) => lowered.includes(pattern));
}

function isBlockedCandidate(title: string, channelName: string): boolean {
  const merged = `${title} ${channelName}`.toLowerCase();
  return hasAny(merged, BLOCKED_TITLE_PATTERNS);
}

function disqualifyCandidate(title: string): boolean {
  return hasAny(title.toLowerCase(), DISQUALIFY_TITLE_PATTERNS);
}

function parseDurationSeconds(text: string): number | null {
  if (!text) return null;
  const parts = text.split(":").map((part) => safeToNumber(part));
  if (parts.some((part) => part === null)) return null;
  if (parts.length === 3) {
    return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  }
  if (parts.length === 2) {
    return parts[0]! * 60 + parts[1]!;
  }
  if (parts.length === 1) {
    return parts[0]!;
  }
  return null;
}

function scoreCandidate(candidate: {
  title: string;
  channelName: string;
  isVerified: boolean;
  durationText: string;
}): number {
  const title = toLowerOrEmpty(candidate.title);
  const channelName = toLowerOrEmpty(candidate.channelName);
  let score = 0;

  score += hasAny(title, OFFICIAL_TITLE_PATTERNS) ? 35 : 0;
  if (title.includes("official") && channelName.includes("official")) {
    score += 20;
  }

  if (disqualifyCandidate(title)) {
    score -= 80;
  }

  for (const pattern of OFFICIAL_CHANNEL_PATTERNS) {
    if (channelName.includes(pattern)) {
      score += 12;
      break;
    }
  }

  if (candidate.isVerified) score += 18;

  const duration = parseDurationSeconds(candidate.durationText);
  if (duration !== null) {
    if (duration >= 90 && duration <= 520) score += 12;
    if (duration < 60) score -= 20;
    if (duration > 1200) score -= 15;
  }

  return score;
}

function buildSearchQueries(
  keyword: string,
  emotion: Emotion,
  context?: MusicContext,
): string[] {
  const safeKeyword = keyword.trim().replace(/["'`]/g, "").slice(0, 100);
  const fallbackKeyword = `${emotion} song`;
  const base = safeKeyword || fallbackKeyword;
  const intensity = clamp(context?.emotionScore ?? 0.5, 0.0, 1.0);
  const toneIndex = intensity >= 0.75 ? 2 : intensity >= 0.45 ? 1 : 0;
  const tone = EMOTION_HINTS[emotion][toneIndex];
  const mood = intensity >= 0.75 ? "single" : "song";

  const queries = [
    `${base} official mv`,
    `${base} official music video`,
    `${base} ${mood}`,
    `${base} ${tone}`,
    `${base} official`,
    `${base}`,
  ];

  const deduped = [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
  return deduped.slice(0, 5);
}

function extractInitialData(html: string): Record<string, unknown> | null {
  const marker = "ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const payloadStart = start + marker.length;
  const payloadEnd = html.indexOf("</script>", payloadStart);
  if (payloadEnd === -1) return null;

  const raw = html.slice(payloadStart, payloadEnd).trim();
  const jsonText = raw.startsWith("{")
    ? raw
    : raw.slice(0, raw.lastIndexOf("};") + 1).trim().replace(/;$/, "");
  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    const fallback = raw.match(/(\{[\s\S]*\});?/);
    if (!fallback) return null;
    try {
      return JSON.parse(fallback[1]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function collectVideos(node: unknown): Array<Record<string, unknown>> {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) {
    return node.flatMap((item) => collectVideos(item));
  }

  const record = node as Record<string, unknown>;
  const direct = typeof record.videoRenderer === "object" && record.videoRenderer !== null
    ? [record.videoRenderer as Record<string, unknown>]
    : [];

  return direct.concat(
    Object.values(record).flatMap((value) => collectVideos(value)),
  );
}

function extractTrackFromRenderer(videoRenderer: Record<string, unknown>): RankedVideo | null {
  const typed = videoRenderer as unknown as YouTubeVideoRenderer;
  const videoId = typed.videoId;
  if (typeof videoId !== "string" || !videoId) return null;

  const title = normalizeYouTubeText(typed.title);
  const channelName = normalizeYouTubeText(typed.ownerText) || normalizeYouTubeText(typed.longBylineText);
  const durationText = normalizeYouTubeText(typed.lengthText);

  if (!title || isBlockedCandidate(title, channelName)) return null;

  const score = scoreCandidate({
    title,
    channelName,
    isVerified: Boolean(typed.ownerBadges?.some((badge) =>
      typeof badge?.metadataBadgeRenderer?.style === "string" &&
      badge.metadataBadgeRenderer.style.toLowerCase().includes("verified"),
    )),
    durationText,
  });

  return {
    id: videoId,
    title,
    score,
  };
}

async function searchYouTubeVideo(query: string): Promise<RankedVideo[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.youtube.com/results?search_query=${encoded}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const data = extractInitialData(html);
    if (!data) return [];

    const renderers = collectVideos(data).slice(0, 600);
    const ranked = renderers
      .map((renderer) => extractTrackFromRenderer(renderer))
      .filter((track): track is RankedVideo => Boolean(track))
      .filter((track) => !isBlockedCandidate(track.title, ""))
      .filter((track) => track.score > 10)
      .sort((a, b) => b.score - a.score);

    return ranked;
  } catch {
    return [];
  }
}

function pickFallbackTrack(emotion: Emotion): YoutubeTrack {
  const tracks = EMOTION_FALLBACK[emotion] ?? EMOTION_FALLBACK.peace;
  const index = (tracks.length && new Date().getDate()) % tracks.length;
  return tracks[index % tracks.length]!;
}

function pickBestCandidate(
  candidates: RankedVideo[],
): YoutubeTrack | null {
  if (!candidates.length) {
    return null;
  }

  const safeCandidates = candidates.filter((candidate) => {
    if (isBlockedCandidate(candidate.title, "")) return false;
    if (disqualifyCandidate(candidate.title)) return false;
    return true;
  });

  if (!safeCandidates.length) return null;

  const sorted = safeCandidates.sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (!best || best.score <= 15) {
    return null;
  }

  return {
    id: best.id,
    title: best.title,
  };
}

export async function searchMusic(
  keyword: string,
  emotion: Emotion,
  context?: MusicContext,
): Promise<MusicTrack | null> {
  const queries = buildSearchQueries(keyword, emotion, context);
  const allCandidates: RankedVideo[] = [];
  const seen = new Set<string>();

  const batch = await Promise.all(
    queries.map(async (query) => ({
      tracks: await searchYouTubeVideo(query),
    })),
  );

  for (const result of batch) {
    for (const candidate of result.tracks) {
      if (isBlockedCandidate(candidate.title, "")) continue;
      if (disqualifyCandidate(candidate.title)) continue;
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      allCandidates.push(candidate);
    }
  }

  const selected = pickBestCandidate(allCandidates);
  if (selected) {
    return {
      title: selected.title,
      url: `https://www.youtube.com/embed/${selected.id}`,
    };
  }

  const fallback = pickFallbackTrack(emotion);
  return {
    title: fallback.title,
    url: `https://www.youtube.com/embed/${fallback.id}`,
  };
}
