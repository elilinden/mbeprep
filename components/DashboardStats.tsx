"use client";

import { Target, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { DashboardStats as DashboardStatsType } from "@/lib/types";

export function DashboardStats({ stats }: { stats: DashboardStatsType }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassCard>
        <p className="text-sm text-slate-950/58">Overall accuracy</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.accuracy}%</p>
        <ProgressBar value={stats.accuracy} />
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-slate-950/58">Questions attempted</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.attempted}</p>
        <p className="mt-2 text-sm text-slate-950/60">of {stats.totalQuestions} loaded questions</p>
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-slate-950/58">Correct / incorrect</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{stats.correct}<span className="text-slate-950/25"> / </span>{stats.incorrect}</p>
        <p className="mt-2 text-sm text-slate-950/60">Current streak: {stats.streak}</p>
      </GlassCard>
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-950/58">Next best set</p>
            <p className="mt-3 text-xl font-semibold tracking-tight">
              {stats.weakAreas[0] ? stats.weakAreas[0].subtopic : "Mixed Practice"}
            </p>
            <p className="mt-2 text-sm text-slate-950/58">
              {stats.weakAreas[0] ? stats.weakAreas[0].subject : "Start with a balanced set"}
            </p>
          </div>
          {stats.weakAreas[0] ? <Target className="h-6 w-6 text-indigo-600" /> : <TrendingUp className="h-6 w-6 text-indigo-600" />}
        </div>
      </GlassCard>
    </div>
  );
}
