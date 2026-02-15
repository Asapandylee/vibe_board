"use client";

import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import type { DiaryEntry } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";
import { MusicPlayer } from "./music-player";

type Props = {
  entry: DiaryEntry;
  onClose: () => void;
};

export function AiResponse({ entry, onClose }: Props) {
  const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl"
    >
      {/* Emotion header gradient */}
      {emotionInfo && (
        <div className={`h-1.5 bg-gradient-to-r ${emotionInfo.gradient}`} />
      )}

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-400">
              AI 감정 분석 결과
            </span>
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
                <span className="text-xl font-bold text-white">
                  {emotionInfo.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {entry.emotion_score
                    ? `${Math.round(entry.emotion_score * 100)}%`
                    : ""}
                </span>
              </div>
              {/* Emotion score bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(entry.emotion_score || 0.5) * 100}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${emotionInfo.gradient}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI message */}
        {entry.ai_message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/30"
          >
            <p className="text-zinc-300 leading-relaxed text-[15px]">
              {entry.ai_message}
            </p>
          </motion.div>
        )}

        {/* Music player */}
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
      </div>
    </motion.div>
  );
}
