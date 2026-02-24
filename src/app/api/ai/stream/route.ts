import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeVoiceTone, streamAiMessage } from "@/lib/gemini";
import { getVoiceToneFallbackMessage } from "@/lib/voice-tone";
import type { PastDiary } from "@/lib/gemini";
import type { Emotion } from "@/lib/supabase/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { diaryId?: unknown; voiceTone?: unknown }
    | null;

  const diaryId = typeof body?.diaryId === "string" ? body.diaryId : "";
  const voiceTone = normalizeVoiceTone(body?.voiceTone);

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
          { voiceTone },
        )) {
          fullMessage += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("Stream error:", err);
        const fallback = getVoiceToneFallbackMessage(voiceTone, "stream");
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
