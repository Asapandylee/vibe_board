"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { deleteVibe } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type VibeListProps = {
  initialMessages: Message[];
};

export function VibeList({ initialMessages }: VibeListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { user } = useUser();
  const { toast } = useToast();

  // Realtime 구독
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel("messages-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => [newMessage, ...prev]);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
          },
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleDelete = async (messageId: string) => {
    const result = await deleteVibe(messageId);

    if (!result.success) {
      toast({
        title: "오류",
        description: result.error || "메시지 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full space-y-3">
      {messages.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">아직 Vibe가 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 메시지를 남겨보세요!</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isOwner = user?.id === message.user_id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`relative rounded-xl border px-5 py-4 bg-zinc-900/40 border-zinc-700/50 hover:border-zinc-600/50 transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-zinc-200 truncate">
                        {message.user_name}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {formatDistanceToNow(new Date(message.inserted_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-lg text-zinc-100 break-words">
                      {message.content}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
