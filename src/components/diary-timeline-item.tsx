"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { DiaryEntry } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";

type Props = {
  entry: DiaryEntry;
};

export function DiaryTimelineItem({ entry }: Props) {
  const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;
  const date = new Date(entry.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/diary/${entry.id}`}
        className="block p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-all duration-200 group"
      >
        <div className="flex items-start gap-4">
          {/* Emotion indicator */}
          <div className="flex-shrink-0 mt-0.5">
            {emotionInfo ? (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${emotionInfo.color}15` }}
              >
                {emotionInfo.emoji}
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">
                📝
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-zinc-300 line-clamp-2 leading-relaxed">
              {entry.content}
            </p>

            {/* AI message preview */}
            {entry.ai_message && (
              <p className="text-xs text-zinc-600 mt-2 line-clamp-1 italic">
                💬 {entry.ai_message}
              </p>
            )}

            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-xs text-zinc-600">{dateStr}</span>
              <span className="text-xs text-zinc-700">{timeStr}</span>
              {emotionInfo && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${emotionInfo.color}15`,
                    color: emotionInfo.color,
                  }}
                >
                  {emotionInfo.label}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 mt-3 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}
