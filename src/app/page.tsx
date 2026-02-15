import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getDiaries } from "./actions";
import { DiaryEditor } from "@/components/diary-editor";
import { DiaryPreviewList } from "@/components/diary-preview-list";
import { AppHeader } from "@/components/app-header";

export default async function Home() {
  const { userId } = await auth();
  const entries = userId ? await getDiaries() : [];

  return (
    <main className="min-h-screen bg-zinc-950">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-6 py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI 감정 분석
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            오늘 하루,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              어떠셨나요?
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
            일기를 남기면 AI가 감정을 분석하고,{" "}
            <br className="hidden sm:block" />
            당신에게 어울리는 음악과 따뜻한 메시지를 전해드려요.
          </p>
        </div>

        {/* Diary Editor or Login CTA */}
        {userId ? (
          <DiaryEditor />
        ) : (
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl p-8 text-center space-y-4">
            <p className="text-zinc-400">
              로그인하고 오늘의 일기를 남겨보세요.
            </p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                시작하기
              </button>
            </SignInButton>
          </div>
        )}

        {/* Recent Entries */}
        {userId && entries.length > 0 && (
          <DiaryPreviewList entries={entries.slice(0, 3)} />
        )}

        {/* Footer */}
        <footer className="text-center pt-8 pb-6 text-zinc-600 text-xs">
          <p>Bad Day — 나쁜 하루도 괜찮아 🌧️</p>
        </footer>
      </div>
    </main>
  );
}
