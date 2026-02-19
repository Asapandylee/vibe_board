"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Music,
} from "lucide-react";
import { EMOTION_MAP } from "@/lib/supabase/types";

type Props = {
  title: string;
  url: string; // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
  emotion: string | null;
};

export function MusicPlayer({ title, url, emotion }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const emotionInfo = emotion
    ? EMOTION_MAP[emotion as keyof typeof EMOTION_MAP]
    : null;

  const videoId = url ? url.match(/embed\/([^?&#]+)/)?.[1] : null;
  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : null;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`
    : null;

  return (
    <div className="rounded-xl border border-zinc-700/30 bg-zinc-800/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-700/20 transition-colors text-left"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            emotionInfo
              ? `bg-gradient-to-br ${emotionInfo.gradient} opacity-80`
              : "bg-red-500/20"
          }`}
        >
          <Music className="w-4 h-4 text-white/90" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase">
            감정에 어울리는 음악
          </p>
          <p className="text-sm text-zinc-300 truncate font-medium mt-0.5">
            {title}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-zinc-600/50 transition-colors text-zinc-500 hover:text-zinc-300"
              title="YouTube에서 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Player 영역 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="player"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-3.5 pb-3.5">
              {embedUrl ? (
                <div
                  className="relative w-full rounded-lg overflow-hidden bg-zinc-900"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  /></div>
              ) : (
                <p className="text-xs text-zinc-600 py-2">
                  이 일기는 음악 정보가 없습니다. 새 일기를 작성하면 음악이
                  추천됩니다.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
