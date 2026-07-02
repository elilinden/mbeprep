import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { DashboardStats as DashboardStatsType } from "@/lib/types";

function formatAverageTime(seconds: number) {
  if (!seconds) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function DashboardStats({ stats }: { stats: DashboardStatsType }) {
  const remaining = Math.max(0, stats.totalQuestions - stats.attempted);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassCard>
        <p className="text-sm text-slate-950/58">Overall Accuracy</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.accuracy}%</p>
        <p className="mt-2 text-sm text-slate-950/60">{stats.correct} of {stats.totalAttempts} correct</p>
        <ProgressBar value={stats.accuracy} />
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-slate-950/58">Questions Answered</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.attempted}</p>
        <p className="mt-2 text-sm text-slate-950/60">{remaining} unanswered questions available</p>
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-slate-950/58">Current Streak</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.streak}</p>
        <p className="mt-2 text-sm text-slate-950/60">{stats.streak} correct answer{stats.streak === 1 ? "" : "s"}</p>
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-slate-950/58">Average Time</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{formatAverageTime(stats.averageTime)}</p>
        <p className="mt-2 text-sm text-slate-950/60">{stats.averageTime ? "per answered question" : "No timing yet"}</p>
      </GlassCard>
    </div>
  );
}
