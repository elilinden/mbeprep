"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { GlassCard } from "@/components/GlassCard";
import { SubjectMastery } from "@/components/SubjectMastery";
import { WeakAreasList } from "@/components/WeakAreasList";
import { getDashboardStats, resetProgress } from "@/lib/progress";
import type { DashboardStats as DashboardStatsType } from "@/lib/types";

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);

  function refresh() {
    setStats(getDashboardStats());
  }

  function confirmReset() {
    if (window.confirm("Reset all local progress? This cannot be undone.")) {
      resetProgress();
      refresh();
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("mbe-progress-updated", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mbe-progress-updated", refresh);
    };
  }, []);

  if (!stats) {
    return <GlassCard>Loading dashboard...</GlassCard>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your study signal</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={confirmReset}
            className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 font-semibold text-slate-700 hover:bg-white"
          >
            <RotateCcw className="mr-2 inline h-4 w-4" />
            Reset Progress
          </button>
          <Link href="/practice" className="rounded-2xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700">
            Start next set
          </Link>
        </div>
      </div>
      <DashboardStats stats={stats} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SubjectMastery subjects={stats.subjectStats} />
        <WeakAreasList areas={stats.weakAreas.slice(0, 5)} title="Needs Work" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <h2 className="text-xl font-semibold">Recent mistakes</h2>
          <div className="mt-4 space-y-3">
            {stats.recentMistakes.length ? stats.recentMistakes.map((attempt) => (
              <div key={`${attempt.questionId}-${attempt.timestamp}`} className="rounded-2xl bg-white/62 p-4">
                <p className="font-semibold">{attempt.subject}</p>
                <p className="mt-1 text-sm text-slate-950/62">{attempt.subtopic}</p>
              </div>
            )) : <p className="text-slate-950/62">No mistakes logged yet.</p>}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">Most common traps</h2>
          <div className="mt-4 space-y-3">
            {stats.commonTraps.length ? stats.commonTraps.map((trap) => (
              <div key={trap.trap} className="rounded-2xl bg-white/62 p-4">
                <p className="text-sm leading-6 text-slate-950/72">{trap.trap}</p>
                <p className="mt-2 text-xs font-semibold text-indigo-700">{trap.count} time{trap.count === 1 ? "" : "s"}</p>
              </div>
            )) : <p className="text-slate-950/62">Traps appear after missed questions.</p>}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">You&apos;re improving at...</h2>
          <div className="mt-4 space-y-3">
            {stats.improving.length ? stats.improving.map((area) => (
              <div key={area.id} className="rounded-2xl bg-white/62 p-4">
                <p className="font-semibold">{area.subtopic}</p>
                <p className="mt-1 text-sm text-slate-950/62">{area.correctRecovery} recovery answer{area.correctRecovery === 1 ? "" : "s"}</p>
              </div>
            )) : <p className="text-slate-950/62">Get a weak topic right and it will show here.</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
