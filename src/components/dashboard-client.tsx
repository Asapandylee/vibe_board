"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Award } from "lucide-react";
import type { DiaryEntry, Emotion } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";
import { EmotionCalendar } from "./emotion-calendar";

type Props = {
  stats: {
    total: number;
    byEmotion: Record<string, number>;
    recentEntries: DiaryEntry[];
  };
};

export function DashboardClient({ stats }: Props) {
  const { total, byEmotion, recentEntries } = stats;
  const [insights, setInsights] = useState<{
    summary: string;
    patterns: string[];
    triggers: string[];
    recommendations: string[];
  } | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // 가장 많은 감정 찾기
  const topEmotion = Object.entries(byEmotion).sort(
    ([, a], [, b]) => b - a,
  )[0] as [Emotion, number] | undefined;

  const topEmotionInfo = topEmotion ? EMOTION_MAP[topEmotion[0]] : null;

  useEffect(() => {
    let mounted = true;

    async function loadInsights() {
      try {
        setIsLoadingInsights(true);
        setInsightError(null);
        const res = await fetch("/api/ai/insights?range=30&voiceTone=2", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("insights request failed");
        const json = (await res.json()) as {
          insights?: {
            summary: string;
            patterns: string[];
            triggers: string[];
            recommendations: string[];
          };
        };
        if (!mounted) return;
        setInsights(json.insights ?? null);
      } catch {
        if (!mounted) return;
        setInsightError("인사이트를 불러오지 못했어요.");
      } finally {
        if (mounted) setIsLoadingInsights(false);
      }
    }

    loadInsights();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40"
        >
          <BookOpen className="w-5 h-5 text-indigo-400 mb-2" />
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-zinc-500 mt-0.5">총 일기 수</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40"
        >
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {Object.keys(byEmotion).length}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">감정 종류</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 col-span-2 sm:col-span-1"
        >
          <Award className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {topEmotionInfo
              ? `${topEmotionInfo.emoji} ${topEmotionInfo.label}`
              : "-"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">최다 감정</p>
        </motion.div>
      </div>

      {/* Emotion Distribution */}
      {Object.keys(byEmotion).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-4">감정 분포</h3>
          <div className="space-y-2.5">
            {(Object.entries(byEmotion) as [Emotion, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([emotion, count]) => {
                const info = EMOTION_MAP[emotion];
                if (!info) return null;
                const pct = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">
                      {info.emoji}
                    </span>
                    <span className="text-sm text-zinc-400 w-10">
                      {info.label}
                    </span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                    </div>
                    <span className="text-xs text-zinc-600 w-12 text-right">
                      {count}건 ({Math.round(pct)}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Emotion Calendar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40"
      >
        <h3 className="text-sm font-medium text-zinc-400 mb-4">감정 캘린더</h3>
        <EmotionCalendar entries={recentEntries} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 space-y-3"
      >
        <h3 className="text-sm font-medium text-zinc-400">AI 인사이트 (최근 30일)</h3>
        {isLoadingInsights && (
          <p className="text-sm text-zinc-500">인사이트를 분석 중입니다...</p>
        )}
        {insightError && (
          <p className="text-sm text-red-400">{insightError}</p>
        )}
        {!isLoadingInsights && !insightError && insights && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed">{insights.summary}</p>
            {!!insights.patterns.length && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">반복 패턴</p>
                <ul className="space-y-1">
                  {insights.patterns.map((item, idx) => (
                    <li key={`pattern-${idx}`} className="text-sm text-zinc-400">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!!insights.recommendations.length && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">실행 제안</p>
                <ul className="space-y-1">
                  {insights.recommendations.map((item, idx) => (
                    <li key={`recommend-${idx}`} className="text-sm text-zinc-400">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {total === 0 && (
        <div className="text-center py-10 space-y-3">
          <div className="text-4xl">📊</div>
          <p className="text-zinc-500 text-sm">
            아직 데이터가 없어요. 일기를 작성하면 감정 통계가 나타납니다.
          </p>
        </div>
      )}
    </div>
  );
}
