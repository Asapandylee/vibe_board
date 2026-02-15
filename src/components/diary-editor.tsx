"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, BookOpen } from "lucide-react";
import { createDiary } from "@/app/actions";
import type { DiaryEntry } from "@/lib/supabase/types";
import { AiResponse } from "./ai-response";

export function DiaryEditor() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const isValid = charCount >= 1 && charCount <= 2000;

  function handleSubmit() {
    if (!isValid || isPending) return;

    setError(null);
    startTransition(async () => {
      const res = await createDiary(content);
      if (res.success && res.data) {
        setResult(res.data);
        setContent("");
      } else {
        setError(res.error || "오류가 발생했습니다.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-400">
              오늘의 일기
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어떠셨나요? 자유롭게 적어보세요..."
            disabled={isPending}
            rows={6}
            maxLength={2000}
            className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-lg leading-relaxed"
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
            <span
              className={`text-xs transition-colors ${
                charCount > 1800
                  ? "text-amber-400"
                  : charCount > 0
                    ? "text-zinc-500"
                    : "text-zinc-700"
              }`}
            >
              {charCount} / 2,000
            </span>

            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:shadow-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  일기 남기기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        <AnimatePresence>
          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                </div>
                <p className="text-sm text-zinc-400">
                  AI가 감정을 분석하고 있어요...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Response */}
      <AnimatePresence>
        {result && (
          <AiResponse entry={result} onClose={() => setResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
