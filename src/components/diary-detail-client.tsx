"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, Calendar, Clock } from "lucide-react";
import type { DiaryEntry } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";
import { MusicPlayer } from "./music-player";
import { deleteDiary } from "@/app/actions";

type Props = {
  entry: DiaryEntry;
};

export function DiaryDetailClient({ entry }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const emotionInfo = entry.emotion ? EMOTION_MAP[entry.emotion] : null;
  const date = new Date(entry.created_at);

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
            <span className="text-lg font-bold text-white">
              {emotionInfo.label}
            </span>
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
            <span className="text-sm font-medium text-indigo-400">
              AI의 한마디
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-[15px]">
            {entry.ai_message}
          </p>
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
