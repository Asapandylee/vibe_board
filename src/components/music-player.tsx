"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import type { Emotion } from "@/lib/supabase/types";

type Props = {
  title: string;
  url: string;
  emotion: string | null;
};

export function MusicPlayer({ title, url, emotion }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasAudio, setHasAudio] = useState(!!url);

  useEffect(() => {
    if (!url) {
      setHasAudio(false);
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = 0.4;
    audio.loop = true;

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener("error", () => {
      setHasAudio(false);
    });

    audio.addEventListener("canplay", () => {
      setHasAudio(true);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  function togglePlay() {
    if (!audioRef.current || !hasAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function toggleMute() {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
      <div className="flex-shrink-0">
        {hasAudio ? (
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-indigo-400" />
            ) : (
              <Play className="w-4 h-4 text-indigo-400 ml-0.5" />
            )}
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700/30 flex items-center justify-center">
            <Music className="w-4 h-4 text-zinc-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate font-medium">{title}</p>
        {hasAudio ? (
          <div className="mt-1.5 w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <p className="text-xs text-zinc-600 mt-0.5">감정에 어울리는 음악</p>
        )}
      </div>

      {hasAudio && (
        <button
          onClick={toggleMute}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-zinc-500 hover:text-zinc-300"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
