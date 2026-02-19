"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import type { DiaryEntry } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";
import { MusicPlayer } from "./music-player";

type ChatMessage = { role: "user" | "ai"; content: string };

type Props = {
  entry: DiaryEntry;
  onClose: () => void;
};

export function AiResponse({ entry, onClose }: Props) {
  const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;

  const [streamedMessage, setStreamedMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 마운트 시 AI 메시지 스트리밍 시작
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function startStream() {
      try {
        const res = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diaryId: entry.id }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setStreamedMessage((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStreamedMessage("오늘 하루도 수고했어요. 일기를 쓰는 것만으로도 대단한 거예요. 💙");
        }
      } finally {
        setIsStreaming(false);
      }
    }

    startStream();
    return () => controller.abort();
  }, [entry.id]);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleSend() {
    if (!inputValue.trim() || isChatStreaming || isStreaming) return;

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
          firstAiMessage: streamedMessage,
          messages: newMessages,
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
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", content: "죄송해요, 잠시 오류가 발생했어요." },
      ]);
    } finally {
      setIsChatStreaming(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl"
    >
      {emotionInfo && (
        <div className={`h-1.5 bg-gradient-to-r ${emotionInfo.gradient}`} />
      )}

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-400">AI 감정 분석 결과</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emotion badge */}
        {emotionInfo && (
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-5xl"
            >
              {emotionInfo.emoji}
            </motion.div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{emotionInfo.label}</span>
                <span className="text-xs text-zinc-500">
                  {entry.emotion_score ? `${Math.round(entry.emotion_score * 100)}%` : ""}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(entry.emotion_score || 0.5) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${emotionInfo.gradient}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 스트리밍 AI 메시지 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/30 min-h-[60px]"
        >
          <p className="text-zinc-300 leading-relaxed text-[15px]">
            {streamedMessage}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </motion.div>

        {/* 음악 플레이어 */}
        {entry.music_title && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <MusicPlayer
              title={entry.music_title}
              url={entry.music_url || ""}
              emotion={entry.emotion}
            />
          </motion.div>
        )}

        {/* 채팅 — 스트리밍 완료 후 표시 */}
        <AnimatePresence>
          {!isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-zinc-800/50 pt-4 space-y-3"
            >
              <p className="text-xs text-zinc-500">AI에게 더 이야기해보세요</p>

              {/* 채팅 메시지 목록 */}
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

              {/* 채팅 입력 */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
