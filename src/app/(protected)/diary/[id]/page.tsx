import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getDiaryById } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { DiaryDetailClient } from "@/components/diary-detail-client";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DiaryDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const entry = await getDiaryById(id);
  if (!entry) notFound();

  return (
    <main className="min-h-screen bg-zinc-950">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        {/* Back link */}
        <Link
          href="/diary"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          일기장으로 돌아가기
        </Link>

        <DiaryDetailClient entry={entry} />
      </div>
    </main>
  );
}
