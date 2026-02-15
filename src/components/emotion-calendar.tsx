"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DiaryEntry, Emotion } from "@/lib/supabase/types";
import { EMOTION_MAP } from "@/lib/supabase/types";

type Props = {
  entries: DiaryEntry[];
  year?: number;
  month?: number;
  onDateClick?: (date: string) => void;
};

export function EmotionCalendar({ entries, year, month, onDateClick }: Props) {
  const now = new Date();
  const displayYear = year ?? now.getFullYear();
  const displayMonth = month ?? now.getMonth(); // 0-indexed

  // 날짜별 감정 매핑
  const emotionByDate = useMemo(() => {
    const map: Record<string, { emotion: Emotion; count: number }> = {};
    for (const entry of entries) {
      const date = new Date(entry.created_at).toISOString().split("T")[0];
      if (entry.emotion) {
        if (!map[date]) {
          map[date] = { emotion: entry.emotion, count: 1 };
        } else {
          map[date].count++;
        }
      }
    }
    return map;
  }, [entries]);

  // 달력 날짜 생성
  const firstDay = new Date(displayYear, displayMonth, 1);
  const lastDay = new Date(displayYear, displayMonth + 1, 0);
  const startPad = firstDay.getDay(); // 0=일, 1=월 ...
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">
          {displayYear}년 {monthNames[displayMonth]}
        </h3>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {dayNames.map((day) => (
          <div key={day} className="text-xs font-medium text-zinc-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`pad-${idx}`} className="aspect-square" />;
          }

          const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const emotionData = emotionByDate[dateStr];
          const isToday =
            day === now.getDate() &&
            displayMonth === now.getMonth() &&
            displayYear === now.getFullYear();

          return (
            <motion.button
              key={dateStr}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateClick?.(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${
                isToday ? "ring-1 ring-indigo-400/50" : ""
              } ${
                emotionData ? "hover:brightness-110" : "hover:bg-zinc-800/50"
              }`}
              style={
                emotionData
                  ? {
                      backgroundColor: `${EMOTION_MAP[emotionData.emotion].color}20`,
                    }
                  : undefined
              }
            >
              <span
                className={`${
                  emotionData ? "text-white font-medium" : "text-zinc-500"
                } ${isToday ? "text-indigo-400 font-bold" : ""}`}
              >
                {day}
              </span>
              {emotionData && (
                <span className="text-[10px] mt-0.5">
                  {EMOTION_MAP[emotionData.emotion].emoji}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        {(
          Object.entries(EMOTION_MAP) as [
            Emotion,
            (typeof EMOTION_MAP)[Emotion],
          ][]
        ).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-[10px] text-zinc-500">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
