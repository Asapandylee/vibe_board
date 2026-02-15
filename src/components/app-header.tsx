import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, BarChart3 } from "lucide-react";

export async function AppHeader() {
  const { userId } = await auth();

  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-2xl px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-base font-bold text-white">🌧️</span>
          </div>
          <span className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
            Bad Day
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {userId ? (
            <>
              <Link
                href="/diary"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">일기장</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">대시보드</span>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all duration-200">
                로그인
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
