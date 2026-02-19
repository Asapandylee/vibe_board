"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { analyzeDiary } from "@/lib/gemini";
import { searchMusic } from "@/lib/music";
import type { DiaryEntry, Emotion } from "@/lib/supabase/types";

// ─────────────────────────────────────────────
// 일기 작성 + AI 분석
// ─────────────────────────────────────────────
export async function createDiary(content: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }
    const userId = user.id;

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 2000) {
      return { success: false, error: "1~2000자 사이로 입력해주세요." };
    }

    // 1. AI 감정 분석
    const analysis = await analyzeDiary(trimmedContent);

    // 2. 음악 검색
    const track = await searchMusic(analysis.music_keyword, analysis.emotion);

    // 3. Supabase 저장
    const supabase = await createClient();
    const userName =
      user.firstName ||
      user.username ||
      user.emailAddresses[0]?.emailAddress ||
      "Anonymous";

    const { data, error } = await supabase
      .from("diary_entries")
      .insert({
        user_id: userId,
        user_name: userName,
        content: trimmedContent,
        emotion: analysis.emotion,
        emotion_score: analysis.emotion_score,
        ai_message: analysis.ai_message,
        music_keyword: analysis.music_keyword,
        music_url: track?.url || null,
        music_title: track?.title || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: "일기 저장에 실패했습니다." };
    }

    revalidatePath("/");
    revalidatePath("/diary");
    return { success: true, data: data as DiaryEntry };
  } catch (error) {
    console.error("createDiary error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

// ─────────────────────────────────────────────
// 일기 목록 조회
// ─────────────────────────────────────────────
export async function getDiaries(): Promise<DiaryEntry[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }
    return (data as DiaryEntry[]) || [];
  } catch (error) {
    console.error("getDiaries error:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// 일기 상세 조회
// ─────────────────────────────────────────────
export async function getDiaryById(id: string): Promise<DiaryEntry | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error);
      return null;
    }
    return data as DiaryEntry;
  } catch (error) {
    console.error("getDiaryById error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// 일기 삭제
// ─────────────────────────────────────────────
export async function deleteDiary(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const supabase = await createClient();

    const { data: entry, error: fetchError } = await supabase
      .from("diary_entries")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !entry) {
      return { success: false, error: "일기를 찾을 수 없습니다." };
    }

    if (entry.user_id !== userId) {
      return { success: false, error: "본인의 일기만 삭제할 수 있습니다." };
    }

    const { error: deleteError } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return { success: false, error: "일기 삭제에 실패했습니다." };
    }

    revalidatePath("/");
    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error("deleteDiary error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

// ─────────────────────────────────────────────
// 감정 통계 (대시보드용)
// ─────────────────────────────────────────────
export type EmotionStat = {
  emotion: Emotion;
  count: number;
  date: string;
};

export async function getEmotionStats(): Promise<{
  total: number;
  byEmotion: Record<string, number>;
  recentEntries: DiaryEntry[];
}> {
  try {
    const { userId } = await auth();
    if (!userId) return { total: 0, byEmotion: {}, recentEntries: [] };

    const supabase = await createClient();

    // 감정 집계용: emotion 컬럼만 조회 (전체 데이터 전송 최소화)
    const [emotionRes, recentRes] = await Promise.all([
      supabase
        .from("diary_entries")
        .select("emotion")
        .eq("user_id", userId),
      supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (emotionRes.error || !emotionRes.data) {
      return { total: 0, byEmotion: {}, recentEntries: [] };
    }

    const byEmotion: Record<string, number> = {};
    for (const row of emotionRes.data) {
      if (row.emotion) {
        byEmotion[row.emotion] = (byEmotion[row.emotion] || 0) + 1;
      }
    }

    return {
      total: emotionRes.data.length,
      byEmotion,
      recentEntries: (recentRes.data as DiaryEntry[]) ?? [],
    };
  } catch (error) {
    console.error("getEmotionStats error:", error);
    return { total: 0, byEmotion: {}, recentEntries: [] };
  }
}
