import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeVoiceTone, streamChatReply } from "@/lib/gemini";
import { getVoiceToneFallbackMessage } from "@/lib/voice-tone";
import type { PastDiary } from "@/lib/gemini";
import type { Emotion } from "@/lib/supabase/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        diaryId?: unknown;
        firstAiMessage?: unknown;
        messages?: unknown;
        voiceTone?: unknown;
      }
    | null;

  const diaryId = typeof body?.diaryId === "string" ? body.diaryId : "";
  const firstAiMessage = typeof body?.firstAiMessage === "string" ? body.firstAiMessage : "";
  const voiceTone = normalizeVoiceTone(body?.voiceTone);
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages = rawMessages.filter(
    (item): item is { role: "user" | "ai"; content: string } =>
      typeof item === "object" &&
      item !== null &&
      (item as { role?: unknown }).role &&
      ((item as { role?: unknown }).role === "user" ||
        (item as { role?: unknown }).role === "ai") &&
      typeof (item as { content?: unknown }).content === "string",
  );

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
          firstAiMessage,
          (pastDiaries ?? []) as PastDiary[],
          messages,
          { voiceTone },
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("Chat stream error:", err);
        controller.enqueue(encoder.encode(getVoiceToneFallbackMessage(voiceTone, "chat")));
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
