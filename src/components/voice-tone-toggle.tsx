"use client";

import type { VoiceToneLevel } from "@/lib/voice-tone";
import { VOICE_TONE_OPTIONS } from "@/lib/voice-tone";

type Props = {
  value: VoiceToneLevel;
  onChange: (value: VoiceToneLevel) => void;
  disabled?: boolean;
};

export function VoiceToneToggle({ value, onChange, disabled = false }: Props) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-zinc-500">AI 톤</p>
      <div className="inline-flex rounded-lg border border-zinc-700/50 bg-zinc-800/40 overflow-hidden">
        {VOICE_TONE_OPTIONS.map((option, index) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`px-2.5 py-2 text-xs transition-colors ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30"
              } ${index === 0 ? "rounded-l-lg" : ""}`}
            >
              <span className="font-medium">{option.label}</span>
              <span className="sr-only">{option.note}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
