export type Emotion =
  | "joy"
  | "sadness"
  | "anger"
  | "anxiety"
  | "peace"
  | "excitement"
  | "gratitude";

export type DiaryEntry = {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  emotion: Emotion | null;
  emotion_score: number | null;
  ai_message: string | null;
  music_keyword: string | null;
  music_url: string | null;
  music_title: string | null;
  created_at: string;
};

export type EmotionInfo = {
  label: string;
  emoji: string;
  color: string;
  gradient: string;
};

export const EMOTION_MAP: Record<Emotion, EmotionInfo> = {
  joy: {
    label: "기쁨",
    emoji: "😊",
    color: "#FBBF24",
    gradient: "from-yellow-400 to-amber-500",
  },
  sadness: {
    label: "슬픔",
    emoji: "😢",
    color: "#60A5FA",
    gradient: "from-blue-400 to-blue-600",
  },
  anger: {
    label: "분노",
    emoji: "😤",
    color: "#F87171",
    gradient: "from-red-400 to-red-600",
  },
  anxiety: {
    label: "불안",
    emoji: "😰",
    color: "#A78BFA",
    gradient: "from-violet-400 to-purple-600",
  },
  peace: {
    label: "평온",
    emoji: "😌",
    color: "#34D399",
    gradient: "from-emerald-400 to-teal-500",
  },
  excitement: {
    label: "설렘",
    emoji: "🤩",
    color: "#FB923C",
    gradient: "from-orange-400 to-orange-600",
  },
  gratitude: {
    label: "감사",
    emoji: "🙏",
    color: "#F9A8D4",
    gradient: "from-pink-300 to-pink-500",
  },
};

export type Database = {
  public: {
    Tables: {
      diary_entries: {
        Row: DiaryEntry;
        Insert: Omit<DiaryEntry, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DiaryEntry>;
      };
    };
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
