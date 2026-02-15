"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { DiaryEntry } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";

type Props = {
  entries: DiaryEntry[];
};

export function DiaryPreviewList({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-200">최근 일기</h3>
        <Link
          href="/diary"
          className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          모두 보기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;
          const date = new Date(entry.created_at);
          const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
            >
              <Link
                href={`/diary/${entry.id}`}
                className="block p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  {emotionInfo && (
                    <span className="text-2xl flex-shrink-0 mt-0.5">
                      {emotionInfo.emoji}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-600">{dateStr}</span>
                      {emotionInfo && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
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
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
