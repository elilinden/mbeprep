"use client";

import { ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { GlassCard } from "@/components/GlassCard";
import { SubjectMastery } from "@/components/SubjectMastery";
import { WeakAreasList } from "@/components/WeakAreasList";
import { cleanTopicTitle, trapTitle } from "@/lib/display";
import { getDashboardStats } from "@/lib/progress";
import type { Attempt, DashboardStats as DashboardStatsType, WeakArea } from "@/lib/types";

function recommendedReason(area: WeakArea | undefined) {
  if (!area) {
    return "Start with a mixed set so your dashboard can learn which subjects need the most attention.";
  }

  return area.reason || "This topic is showing the strongest early signal for review.";
}

function mistakeKey(attempt: Attempt) {
  return `${attempt.questionId}-${attempt.timestamp}`;
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);

  function refresh() {
    setStats(getDashboardStats());
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

  const recommendedArea = stats.weakAreas[0];
  const recommendedHref = recommendedArea
    ? `/practice?mode=weak&subtopic=${encodeURIComponent(recommendedArea.subtopic)}`
    : "/practice";
  const trapsTitle = stats.commonTraps.some((trap) => trap.count > 1) ? "Common Traps" : "Traps You Encountered";

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Your Progress</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-950/62">
          See how you&apos;re performing and what to study next.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Recommended Next</h2>
        <GlassCard strong className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                <Target className="h-4 w-4" />
                Best next practice set
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                {recommendedArea ? cleanTopicTitle(recommendedArea.subtopic) : "Mixed Practice"}
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-950/56">
                {recommendedArea ? `${recommendedArea.subject} · ${recommendedArea.category}` : "Mixed subjects"}
              </p>
              <p className="mt-4 max-w-3xl leading-7 text-slate-950/66">{recommendedReason(recommendedArea)}</p>
            </div>
            <Link
              href={recommendedHref}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-600/18 hover:bg-indigo-700"
            >
              {recommendedArea ? "Practice My Weakest Area" : "Start Recommended Set"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Progress Overview</h2>
        <DashboardStats stats={stats} />
      </section>

      <section>
        <SubjectMastery subjects={stats.subjectStats} />
      </section>

      <section>
        <WeakAreasList areas={stats.weakAreas.slice(0, 5)} title="Needs Review" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <GlassCard>
          <h2 className="text-xl font-semibold">Recent Mistakes</h2>
          <div className="mt-4 space-y-3">
            {stats.recentMistakes.length ? (
              stats.recentMistakes.map((attempt) => (
                <Link
                  key={mistakeKey(attempt)}
                  href={`/practice?question=${encodeURIComponent(attempt.questionId)}`}
                  className="group block rounded-2xl bg-white/62 p-4 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:bg-white/80 hover:ring-indigo-200"
                >
                  <p className="font-semibold">{cleanTopicTitle(attempt.subtopic)}</p>
                  <p className="mt-1 text-sm text-slate-950/62">{attempt.subject} · {attempt.category}</p>
                  <p className="mt-3 text-sm font-semibold text-indigo-700 group-hover:text-indigo-800">
                    Review question <ArrowRight className="inline h-4 w-4" />
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl bg-white/62 p-4 text-slate-950/62">No mistakes logged yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold">{trapsTitle}</h2>
          <div className="mt-4 space-y-3">
            {stats.commonTraps.length ? (
              stats.commonTraps.map((trap) => (
                <div key={trap.trap} className="rounded-2xl bg-white/62 p-4">
                  <p className="font-semibold">{trapTitle(trap.trap)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-950/64">{trap.trap}</p>
                  <p className="mt-3 text-xs font-semibold text-indigo-700">
                    Seen {trap.count} time{trap.count === 1 ? "" : "s"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white/62 p-4 text-slate-950/62">Traps appear after missed questions.</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-xl font-semibold">Improving Topics</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stats.improving.length ? (
            stats.improving.map((area) => (
              <div key={area.id} className="rounded-2xl bg-white/62 p-4">
                <p className="font-semibold">{cleanTopicTitle(area.subtopic)}</p>
                <p className="mt-1 text-sm text-slate-950/62">{area.subject}</p>
                <p className="mt-3 text-sm font-semibold text-indigo-700">
                  {area.correctRecovery} recovery answer{area.correctRecovery === 1 ? "" : "s"}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-white/62 p-4 text-slate-950/62 md:col-span-3">
              Once you answer previously missed topics correctly, your improvements will appear here.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
