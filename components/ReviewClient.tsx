"use client";

import { BookmarkCheck, BookmarkX, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { WeakAreasList } from "@/components/WeakAreasList";
import { questions } from "@/lib/data";
import { cleanTopicTitle } from "@/lib/display";
import { getProgress, getWeakAreas, updateQuestionStats } from "@/lib/progress";
import type { Attempt, Question, UserProgress, WeakArea } from "@/lib/types";

type ReviewTab = "retry" | "saved";

type ReviewQuestion = {
  question: Question;
  reasons: string[];
  lastAttempt?: Attempt;
};

function latestAttempts(progress: UserProgress | null) {
  const latest = new Map<string, Attempt>();

  progress?.attempts.forEach((attempt) => {
    latest.set(attempt.questionId, attempt);
  });

  return latest;
}

function retryReasons(question: Question, attempt: Attempt | undefined) {
  if (!attempt) {
    return [];
  }

  const reasons = [];
  if (!attempt.isCorrect) reasons.push("Incorrect");
  if (attempt.guessed) reasons.push("Guessed");
  if (attempt.markedConfusing) reasons.push("Confusing");
  if (attempt.timeSpent > (question.estimatedSeconds || 90) * 1.35) reasons.push("Slow");
  return reasons;
}

function buildRetryQuestions(progress: UserProgress | null) {
  const latest = latestAttempts(progress);

  return questions
    .map((question) => {
      const lastAttempt = latest.get(question.id);
      const reasons = retryReasons(question, lastAttempt);
      return { question, reasons, lastAttempt };
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => (b.lastAttempt?.timestamp || "").localeCompare(a.lastAttempt?.timestamp || ""));
}

function buildSavedQuestions(progress: UserProgress | null) {
  const savedIds = new Set(progress?.savedQuestionIds || []);

  return questions
    .filter((question) => savedIds.has(question.id))
    .map((question) => ({ question, reasons: ["Saved"] }));
}

function practiceQuestionHref(questionId: string) {
  return `/practice?question=${encodeURIComponent(questionId)}`;
}

function reviewSetHref(items: ReviewQuestion[]) {
  return `/practice?ids=${items.map((item) => encodeURIComponent(item.question.id)).join(",")}`;
}

function QuestionReviewRow({
  item,
  actionLabel,
  onRemoveSaved
}: {
  item: ReviewQuestion;
  actionLabel: string;
  onRemoveSaved?: (questionId: string) => void;
}) {
  const { question, reasons } = item;

  return (
    <div className="rounded-3xl bg-white/62 p-4 ring-1 ring-transparent transition hover:bg-white/78 hover:ring-indigo-200 focus-within:ring-2 focus-within:ring-indigo-300">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-700">{question.subject}</p>
          <p className="mt-2 text-base font-semibold leading-7 text-slate-950">
            <span className="[display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {question.stem || cleanTopicTitle(question.subtopic)}
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-950/58">{cleanTopicTitle(question.subtopic)}</p>
          {reasons.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {reasons.map((reason) => (
                <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={practiceQuestionHref(question.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {actionLabel}
          </Link>
          {onRemoveSaved ? (
            <button
              type="button"
              onClick={() => onRemoveSaved(question.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`Remove ${cleanTopicTitle(question.subtopic)} from saved questions`}
            >
              <BookmarkX className="mr-2 h-4 w-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ReviewClient() {
  const [areas, setAreas] = useState<WeakArea[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [selectedTab, setSelectedTab] = useState<ReviewTab | null>(null);

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

  const retryQuestions = useMemo(() => buildRetryQuestions(progress), [progress]);
  const savedQuestions = useMemo(() => buildSavedQuestions(progress), [progress]);
  const reviewSetAvailable = retryQuestions.length > 0;
  const defaultTab: ReviewTab = retryQuestions.length || !savedQuestions.length ? "retry" : "saved";
  const activeTab: ReviewTab =
    selectedTab === "retry" && !retryQuestions.length && savedQuestions.length
      ? "saved"
      : selectedTab === "saved" && !savedQuestions.length && retryQuestions.length
        ? "retry"
        : selectedTab || defaultTab;

  function removeSavedQuestion(questionId: string) {
    updateQuestionStats(questionId, false);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Review</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-950/62">
          Retry missed questions, revisit saved questions, and strengthen weak topics.
        </p>
      </div>

      <GlassCard strong>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700/70">Review Summary</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {retryQuestions.length} question{retryQuestions.length === 1 ? "" : "s"} to retry · {areas.length} topic{areas.length === 1 ? "" : "s"} to review · {savedQuestions.length} saved
            </p>
          </div>
          {reviewSetAvailable ? (
            <Link
              href={reviewSetHref(retryQuestions)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/18 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Review Set
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Review Set
            </button>
          )}
        </div>
        {!reviewSetAvailable ? (
          <p className="mt-3 text-sm leading-6 text-slate-950/58">
            No questions are available for a combined review set yet. Answer practice questions and missed or flagged questions will appear here.
          </p>
        ) : null}
      </GlassCard>

      <WeakAreasList
        areas={areas}
        title="Topics to Review"
        subtitle="Prioritized using your mistakes, uncertainty, repeated trouble, and time spent."
        actionLabel="Practice Topic"
        emptyMessage="No topics currently need review. Keep practicing and this list will appear when a topic needs attention."
      />

      <GlassCard className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Question Review</h2>
            <p className="mt-1 text-sm leading-6 text-slate-950/58">
              Individual questions are separate from the topic rankings above.
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-2xl bg-white/60 p-1" role="tablist" aria-label="Review question lists">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "retry"}
              onClick={() => setSelectedTab("retry")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 ${activeTab === "retry" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white/70"}`}
            >
              Questions to Retry ({retryQuestions.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "saved"}
              onClick={() => setSelectedTab("saved")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 ${activeTab === "saved" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white/70"}`}
            >
              Saved Questions ({savedQuestions.length})
            </button>
          </div>
        </div>

        {activeTab === "retry" ? (
          <div role="tabpanel" className="space-y-3">
            {retryQuestions.length ? (
              retryQuestions.map((item) => (
                <QuestionReviewRow key={item.question.id} item={item} actionLabel="Retry Question" />
              ))
            ) : (
              <div className="rounded-3xl bg-white/62 p-5">
                <p className="font-semibold">No questions need to be retried</p>
                <p className="mt-2 text-sm leading-6 text-slate-950/62">Missed, guessed, confusing, or slow questions will appear here after practice.</p>
                <Link href="/practice" className="mt-4 inline-flex rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                  Go to Practice Questions
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-3">
            {savedQuestions.length ? (
              savedQuestions.map((item) => (
                <QuestionReviewRow
                  key={item.question.id}
                  item={item}
                  actionLabel="Review Question"
                  onRemoveSaved={removeSavedQuestion}
                />
              ))
            ) : (
              <div className="rounded-3xl bg-white/62 p-5">
                <div className="flex items-start gap-3">
                  <BookmarkCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-semibold">No saved questions yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-950/62">Save a question during practice to revisit it here.</p>
                    <Link href="/practice" className="mt-4 inline-flex rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                      Go to Practice Questions
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
