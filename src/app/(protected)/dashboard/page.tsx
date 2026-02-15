import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEmotionStats } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const stats = await getEmotionStats();

  return (
    <main className="min-h-screen bg-zinc-950">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">감정 대시보드</h1>
          <p className="text-sm text-zinc-500 mt-1">
            나의 감정 변화를 한눈에 살펴보세요
          </p>
        </div>

        <DashboardClient stats={stats} />
      </div>
    </main>
  );
}
