import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { streamAiMessage } from "@/lib/gemini";
import type { PastDiary } from "@/lib/gemini";
import type { Emotion } from "@/lib/supabase/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { diaryId } = await req.json();
  if (!diaryId) return new Response("diaryId required", { status: 400 });

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
      let fullMessage = "";
      try {
        for await (const chunk of streamAiMessage(
          diary.content,
          diary.emotion as Emotion | null,
          (pastDiaries ?? []) as PastDiary[],
        )) {
          fullMessage += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("Stream error:", err);
        const fallback = "오늘 하루도 수고했어요. 일기를 쓰는 것만으로도 대단한 거예요. 💙";
        fullMessage = fallback;
        controller.enqueue(encoder.encode(fallback));
      } finally {
        controller.close();
        if (fullMessage) {
          await supabase
            .from("diary_entries")
            .update({ ai_message: fullMessage })
            .eq("id", diaryId);
        }
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
