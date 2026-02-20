import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateActionPlan } from "@/lib/gemini";
import type { Emotion, StoredActionPlan } from "@/lib/supabase/types";

const bodySchema = z.object({
  diaryId: z.string().uuid(),
});

type ActionPlanDiary = {
  content: string;
  emotion: Emotion | null;
  action_plan: StoredActionPlan | null;
};

type PastDiary = {
  content: string;
  emotion: Emotion | null;
  created_at: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const bodyJson = await req.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(bodyJson);
  if (!parsedBody.success) {
    return Response.json(
      { error: { message: "Invalid request body", issues: parsedBody.error.issues } },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { diaryId } = parsedBody.data;

  const initialDiaryQuery = await supabase
    .from("diary_entries")
    .select("content, emotion, action_plan")
    .eq("id", diaryId)
    .eq("user_id", userId)
    .single();

  let diary = initialDiaryQuery.data as ActionPlanDiary | null;
  let diaryError = initialDiaryQuery.error;

  // Backward compatibility: production DB may not have action_plan yet.
  if (diaryError?.message?.includes("action_plan")) {
    const fallbackDiaryQuery = await supabase
      .from("diary_entries")
      .select("content, emotion")
      .eq("id", diaryId)
      .eq("user_id", userId)
      .single();

    diary = fallbackDiaryQuery.data
      ? ({ ...fallbackDiaryQuery.data, action_plan: null } as ActionPlanDiary)
      : null;
    diaryError = fallbackDiaryQuery.error;
  }

  if (diaryError || !diary) {
    return new Response("Diary not found", { status: 404 });
  }

  if (diary.action_plan) {
    return Response.json({
      diaryId,
      plan: diary.action_plan,
      source: "stored",
    });
  }

  const { data: pastDiaries } = await supabase
    .from("diary_entries")
    .select("content, emotion, created_at")
    .eq("user_id", userId)
    .neq("id", diaryId)
    .order("created_at", { ascending: false })
    .limit(5);

  const plan = await generateActionPlan({
    diaryContent: diary.content,
    emotion: diary.emotion,
    pastDiaries: (pastDiaries ?? []) as PastDiary[],
  });

  const savedPlan: StoredActionPlan = {
    ...plan,
    generated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("diary_entries")
    .update({ action_plan: savedPlan })
    .eq("id", diaryId)
    .eq("user_id", userId);

  if (updateError && !updateError.message?.includes("action_plan")) {
    console.error("action-plan save error:", updateError);
  }

  return Response.json({
    diaryId,
    plan: savedPlan,
    source: "generated",
  });
}
