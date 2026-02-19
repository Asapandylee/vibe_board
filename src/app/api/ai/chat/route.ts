import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { streamChatReply } from "@/lib/gemini";
import type { PastDiary } from "@/lib/gemini";
import type { Emotion } from "@/lib/supabase/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { diaryId, firstAiMessage, messages } = await req.json();
  if (!diaryId || !messages?.length) return new Response("Bad request", { status: 400 });

  const supabase = await createClient();

  const { data: diary } = await supabase
    .from("diary_entries")
    .select("content, emotion")
    .eq("id", diaryId)
    .eq("user_id", userId)
    .single();

  if (!diary) return new Response("Not found", { status: 404 });

  const { data: pastDiaries } = await supabase
    .from("diary_entries")
    .select("content, emotion, created_at")
    .eq("user_id", userId)
    .neq("id", diaryId)
    .order("created_at", { ascending: false })
    .limit(5);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChatReply(
          diary.content,
          diary.emotion as Emotion | null,
          firstAiMessage ?? "",
          (pastDiaries ?? []) as PastDiary[],
          messages,
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("Chat stream error:", err);
        controller.enqueue(encoder.encode("죄송해요, 잠시 오류가 발생했어요."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
