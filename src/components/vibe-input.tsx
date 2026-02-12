"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { createVibe } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function VibeInput() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "로그인 필요",
        description: "메시지를 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Clear input immediately
    setContent("");

    // Submit to server
    startTransition(async () => {
      const result = await createVibe(trimmedContent);

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error || "메시지 전송에 실패했습니다.",
          variant: "destructive",
        });
      }
    });
  };

  const maxLength = 20;
  const remaining = maxLength - content.length;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder={
            isSignedIn
              ? "지금 기분을 20자로 표현해보세요..."
              : "로그인하여 Vibe를 공유하세요"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLength}
          disabled={!isSignedIn || isPending}
          className="h-12 pr-16 text-base bg-zinc-900/50 border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50"
        />
        <span
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
            remaining < 5 ? "text-red-400" : "text-zinc-500"
          }`}
        >
          {remaining}
        </span>
      </div>
      <Button
        type="submit"
        disabled={!isSignedIn || !content.trim() || isPending}
        className="w-full h-11 bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-all duration-200"
      >
        {isPending ? "전송 중..." : "Vibe 공유하기"}
      </Button>
    </form>
  );
}
