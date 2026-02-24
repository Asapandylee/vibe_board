import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateEmotionInsights, normalizeVoiceTone } from "@/lib/gemini";
import type { Emotion } from "@/lib/supabase/types";

const rangeSchema = z.enum(["7", "30", "90"]).default("30");

type InsightDiary = {
  content: string;
  emotion: Emotion | null;
  created_at: string;
};

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsedRange = rangeSchema.safeParse(searchParams.get("range") ?? undefined);
  const rangeDays = Number(parsedRange.success ? parsedRange.data : "30");

  const from = new Date();
  from.setDate(from.getDate() - rangeDays);
  const voiceTone = normalizeVoiceTone(searchParams.get("voiceTone"));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .select("content, emotion, created_at")
    .eq("user_id", userId)
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("insights fetch error:", error);
    return new Response("Failed to load diaries", { status: 500 });
  }

  const diaries = (data ?? []) as InsightDiary[];
  const byEmotion: Record<string, number> = {};
  for (const diary of diaries) {
    if (!diary.emotion) continue;
    byEmotion[diary.emotion] = (byEmotion[diary.emotion] ?? 0) + 1;
  }

  const topEmotion = Object.entries(byEmotion).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const insights = await generateEmotionInsights({
    rangeDays,
    diaries,
    byEmotion,
  }, { voiceTone });

  return Response.json({
    rangeDays,
    totalEntries: diaries.length,
    byEmotion,
    topEmotion,
    insights,
  });
}
