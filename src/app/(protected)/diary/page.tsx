import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getDiaries } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { DiaryTimelineItem } from "@/components/diary-timeline-item";
import { PenLine } from "lucide-react";

export default async function DiaryListPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const entries = await getDiaries();

  return (
    <main className="min-h-screen bg-zinc-950">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">일기장</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {entries.length}개의 일기
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <PenLine className="w-4 h-4" />새 일기
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">📝</div>
            <p className="text-zinc-500">아직 작성한 일기가 없어요.</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all"
            >
              첫 일기 쓰기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <DiaryTimelineItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
