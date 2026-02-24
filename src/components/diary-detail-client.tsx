"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, Calendar, Clock, Send, Loader2 } from "lucide-react";
import type { DiaryEntry, StoredActionPlan } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";
import { MusicPlayer } from "./music-player";
import { deleteDiary } from "@/app/actions";
import { getVoiceToneFallbackMessage, type VoiceToneLevel } from "@/lib/voice-tone";
import { VoiceToneToggle } from "./voice-tone-toggle";

type ChatMessage = { role: "user" | "ai"; content: string };

type Props = {
  entry: DiaryEntry;
};

type ActionPlanResponse = {
  diaryId: string;
  plan: StoredActionPlan;
  source: "stored" | "generated";
};

export function DiaryDetailClient({ entry }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanResponse["plan"] | null>(
    entry.action_plan ?? null,
  );
  const [voiceTone, setVoiceTone] = useState<VoiceToneLevel>(2);

  const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;
  const date = new Date(entry.created_at);
  const chatEndRef = useRef<HTMLDivElement>(null);

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteDiary(entry.id);
      if (res.success) {
        router.push("/diary");
      } else {
        setDeleteError(res.error || "삭제에 실패했습니다.");
        setShowConfirm(false);
      }
    });
  }

  async function handleSend() {
    if (!inputValue.trim() || isChatStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);
    setIsChatStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryId: entry.id,
          firstAiMessage: entry.ai_message ?? "",
          messages: newMessages,
          voiceTone,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Chat failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setChatMessages((prev) => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ai",
            content: updated[updated.length - 1].content + text,
          };
          return updated;
        });
      }

      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", content: getVoiceToneFallbackMessage(voiceTone, "chat") },
      ]);
    } finally {
      setIsChatStreaming(false);
    }
  }

  async function handleCreateActionPlan() {
    if (isPlanLoading) return;
    setIsPlanLoading(true);
    setPlanError(null);

    try {
      const res = await fetch("/api/ai/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryId: entry.id,
          voiceTone,
        }),
      });

      if (!res.ok) throw new Error("Action plan failed");
      const json = (await res.json()) as ActionPlanResponse;
      setActionPlan(json.plan);
    } catch {
      setPlanError("액션 플랜 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsPlanLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Date & Time */}
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {String(date.getHours()).padStart(2, "0")}:
          {String(date.getMinutes()).padStart(2, "0")}
        </div>
      </div>

      {/* Emotion badge */}
      {emotionInfo && (
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emotionInfo.emoji}</span>
          <div>
            <span className="text-lg font-bold text-white">{emotionInfo.label}</span>
            {entry.emotion_score && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.emotion_score * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${emotionInfo.gradient}`}
                  />
                </div>
                <span className="text-xs text-zinc-600">
                  {Math.round(entry.emotion_score * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diary content */}
      <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40">
        <p className="text-zinc-200 leading-[1.8] whitespace-pre-wrap text-[15px]">
          {entry.content}
        </p>
      </div>

      {/* AI message */}
      {entry.ai_message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">✨</span>
            <span className="text-sm font-medium text-indigo-400">AI의 한마디</span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-[15px]">{entry.ai_message}</p>
        </motion.div>
      )}

      {/* Music player */}
      {entry.music_title && (
        <MusicPlayer
          title={entry.music_title}
          url={entry.music_url || ""}
          emotion={entry.emotion}
        />
      )}

      {/* 채팅 */}
      <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 space-y-3">
        <p className="text-xs text-zinc-500">AI에게 더 이야기해보세요</p>

        {chatMessages.length > 0 && (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-500/20 text-indigo-100 rounded-br-sm"
                      : "bg-zinc-800/70 text-zinc-300 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                  {isChatStreaming &&
                    i === chatMessages.length - 1 &&
                    msg.role === "ai" && (
                      <span className="inline-block w-0.5 h-3.5 bg-zinc-400 ml-0.5 align-middle animate-pulse" />
                    )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        <VoiceToneToggle
          value={voiceTone}
          onChange={setVoiceTone}
          disabled={isChatStreaming}
        />

        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="AI에게 물어보세요..."
            disabled={isChatStreaming}
            className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isChatStreaming}
            className="p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-indigo-400"
          >
            {isChatStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Action plan */}
      <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">AI 액션 플랜</p>
          <button
            onClick={handleCreateActionPlan}
            disabled={isPlanLoading}
            className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isPlanLoading ? "생성 중..." : actionPlan ? "다시 생성" : "플랜 만들기"}
          </button>
        </div>

        {planError && (
          <p className="text-sm text-red-400">{planError}</p>
        )}

        {actionPlan && (
          <div className="space-y-3">
            <p className="text-base font-semibold text-white">{actionPlan.title}</p>
            <div className="space-y-2.5">
              {actionPlan.steps.map((step, idx) => (
                <div
                  key={`${step.title}-${idx}`}
                  className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3"
                >
                  <p className="text-sm text-zinc-200 font-medium">
                    {idx + 1}. {step.title} ({step.durationMinutes}분)
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">{step.description}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-300">체크 질문: {actionPlan.checkInQuestion}</p>
          </div>
        )}
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {deleteError}
        </div>
      )}

      {/* Delete button */}
      <div className="pt-4 border-t border-zinc-800/50">
        {showConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">정말 삭제할까요?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all disabled:opacity-50"
            >
              {isPending ? "삭제 중..." : "삭제"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-500 text-sm transition-all"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            일기 삭제
          </button>
        )}
      </div>
    </motion.div>
  );
}
