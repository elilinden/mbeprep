"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { WeakAreasList } from "@/components/WeakAreasList";
import { questions } from "@/lib/data";
import { getProgress, getWeakAreas } from "@/lib/progress";
import type { UserProgress, WeakArea } from "@/lib/types";

export function ReviewClient() {
  const [areas, setAreas] = useState<WeakArea[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  function refresh() {
    setAreas(getWeakAreas());
    setProgress(getProgress());
  }

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("mbe-progress-updated", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mbe-progress-updated", refresh);
    };
  }, []);

  const savedQuestions = useMemo(() => (
    questions.filter((question) => progress?.savedQuestionIds.includes(question.id))
  ), [progress]);

  const retryQuestions = useMemo(() => {
    const ids = new Set(areas.flatMap((area) => area.questionIds));
    return questions.filter((question) => ids.has(question.id)).slice(0, 8);
  }, [areas]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Review</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Turn weak spots into targets</h1>
      </div>
      <WeakAreasList areas={areas} />
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <h2 className="text-xl font-semibold">Questions to retry</h2>
          {retryQuestions.length ? retryQuestions.map((question) => (
            <div key={question.id} className="rounded-3xl bg-white/62 p-4">
              <p className="text-sm font-semibold text-indigo-700">{question.subject}</p>
              <p className="mt-1 font-semibold">{question.subtopic}</p>
              <p className="mt-1 text-sm text-slate-950/58">{question.category}</p>
              <Link
                href={`/practice?question=${encodeURIComponent(question.id)}`}
                className="mt-3 inline-block rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Practice this question
              </Link>
            </div>
          )) : <p className="text-slate-950/62">Questions to retry appear after misses or confusing marks.</p>}
        </GlassCard>
        <GlassCard className="space-y-4">
          <h2 className="text-xl font-semibold">Saved for review</h2>
          {savedQuestions.length ? savedQuestions.map((question) => (
            <div key={question.id} className="rounded-3xl bg-white/62 p-4">
              <p className="text-sm font-semibold text-indigo-700">{question.subject}</p>
              <p className="mt-1 font-semibold">{question.subtopic}</p>
              <p className="mt-1 text-sm text-slate-950/58">{question.difficulty}</p>
              <Link
                href={`/practice?question=${encodeURIComponent(question.id)}`}
                className="mt-3 inline-block rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-50"
              >
                Revisit
              </Link>
            </div>
          )) : <p className="text-slate-950/62">Save questions during practice and they will live here.</p>}
        </GlassCard>
      </div>
    </div>
  );
}
