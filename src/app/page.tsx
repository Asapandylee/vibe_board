import { Suspense } from "react";
import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getVibes } from "./actions";
import { VibeInput } from "@/components/vibe-input";
import { VibeList } from "@/components/vibe-list";

export default async function Home() {
  const { userId } = await auth();
  const messages = await getVibes();

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">V</span>
            </div>
            <h1 className="text-xl font-bold text-white">VibeBoard</h1>
          </div>
          <div className="flex items-center gap-3">
            {userId ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  대시보드
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                    },
                  }}
                />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all duration-200">
                  로그인
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 pb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            지금 당신의{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-300">
              Vibe
            </span>
            는?
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            20자로 표현하는 실시간 상태 보드. 짧지만 강렬하게, 지금 이 순간을
            공유하세요.
          </p>
        </div>

        {/* Input Section */}
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/30 backdrop-blur-sm p-6 shadow-2xl">
          <VibeInput />
        </div>

        {/* Messages Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-zinc-200">실시간 피드</h3>
            <span className="text-sm text-zinc-500">
              {messages.length}개의 Vibe
            </span>
          </div>
          <Suspense
            fallback={
              <div className="text-center py-12 text-zinc-500">
                <div className="inline-block w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <VibeList initialMessages={messages} />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="text-center pt-12 pb-6 text-zinc-500 text-sm">
          <p>Powered by Next.js 15 · Clerk · Supabase</p>
        </footer>
      </div>
    </main>
  );
}
