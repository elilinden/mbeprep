"use client";

import { BookOpenCheck, Clock, ListChecks, Target, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { QuestionCard } from "@/components/QuestionCard";
import { questions, getSubjects } from "@/lib/data";
import { getProgress } from "@/lib/progress";
import { recommendQuestions } from "@/lib/scoring";
import type { Attempt, PracticeMode, Question } from "@/lib/types";

type ModeOption = {
  value: PracticeMode;
  label: string;
  icon: LucideIcon;
};

const modeOptions: ModeOption[] = [
  { value: "mixed", label: "Mixed Practice", icon: BookOpenCheck },
  { value: "subject", label: "Subject Practice", icon: ListChecks },
  { value: "weak", label: "Weak Areas", icon: Target },
  { value: "saved", label: "Saved Questions", icon: BookOpenCheck },
  { value: "timed", label: "Timed Set", icon: Clock }
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function pickQuestions(mode: PracticeMode, subject: string, count: number, targetId?: string, subtopic?: string): Question[] {
  const progress = getProgress();

  if (targetId) {
    return questions.filter((question) => question.id === targetId);
  }

  if (mode === "weak") {
    const weakSet = recommendQuestions(progress, count * 2).filter((question) => !subtopic || question.subtopic === subtopic);
    return shuffle(weakSet.length ? weakSet : questions).slice(0, count);
  }

  if (mode === "saved") {
    const saved = questions.filter((question) => progress.savedQuestionIds.includes(question.id));
    return shuffle(saved.length ? saved : questions).slice(0, count);
  }

  if (mode === "subject" && subject) {
    return shuffle(questions.filter((question) => question.subject === subject)).slice(0, count);
  }

  return shuffle(questions).slice(0, count);
}

export function PracticeClient() {
  const params = useSearchParams();
  const requestedId = params.get("question") || undefined;
  const requestedMode = (params.get("mode") as PracticeMode | null) || (requestedId ? "single" : "mixed");
  const requestedSubtopic = params.get("subtopic") || undefined;
  const requestedSubject = params.get("subject") || "";
  const subjects = getSubjects();

  const [mode, setMode] = useState<PracticeMode>(requestedMode);
  const [subject, setSubject] = useState(requestedSubject || subjects[0] || "");
  const [count, setCount] = useState(10);
  const [started, setStarted] = useState(Boolean(requestedId || requestedSubtopic));
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() => (
    requestedId || requestedSubtopic ? pickQuestions(requestedMode, subject, count, requestedId, requestedSubtopic) : []
  ));
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const current = sessionQuestions[index];
  const sessionAccuracy = attempts.length ? Math.round((attempts.filter((attempt) => attempt.isCorrect).length / attempts.length) * 100) : 0;
  const missed = useMemo(() => attempts.filter((attempt) => !attempt.isCorrect), [attempts]);
  const weakTopics = Array.from(new Set(missed.map((attempt) => attempt.subtopic))).slice(0, 4);

  useEffect(() => {
    if (!started || ended) {
      return;
    }

    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [ended, started]);

  function startSession() {
    const picked = pickQuestions(mode, subject, count, requestedId, requestedSubtopic);
    setSessionQuestions(picked);
    setIndex(0);
    setAttempts([]);
    setEnded(false);
    setElapsed(0);
    setStarted(true);
  }

  function nextQuestion() {
    if (index >= sessionQuestions.length - 1) {
      setEnded(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  if (ended) {
    return (
      <div className="space-y-6">
        <GlassCard strong className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Session summary</p>
          <h1 className="text-4xl font-semibold tracking-tight">Nice work. Here&apos;s the readout.</h1>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl bg-white/64 p-5">
              <p className="text-sm text-slate-950/58">Questions answered</p>
              <p className="mt-2 text-4xl font-semibold">{attempts.length}</p>
            </div>
            <div className="rounded-3xl bg-white/64 p-5">
              <p className="text-sm text-slate-950/58">Accuracy</p>
              <p className="mt-2 text-4xl font-semibold">{sessionAccuracy}%</p>
            </div>
            <div className="rounded-3xl bg-white/64 p-5">
              <p className="text-sm text-slate-950/58">Missed questions</p>
              <p className="mt-2 text-4xl font-semibold">{missed.length}</p>
            </div>
            <div className="rounded-3xl bg-white/64 p-5">
              <p className="text-sm text-slate-950/58">Total time</p>
              <p className="mt-2 text-4xl font-semibold">{formatElapsed(elapsed)}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-white/64 p-5">
            <p className="font-semibold">Weak topics from this session</p>
            <p className="mt-2 text-slate-950/64">{weakTopics.length ? weakTopics.join(", ") : "No weak topics from this set."}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/review" className="rounded-2xl bg-white/76 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-white">
              Review missed questions
            </Link>
            <button
              type="button"
              onClick={startSession}
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Continue practice
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (started && current) {
    return (
      <div className="space-y-4">
        <QuestionCard
          question={current}
          index={index}
          total={sessionQuestions.length}
          elapsed={elapsed}
          onNext={nextQuestion}
          onEnd={() => setEnded(true)}
          onAttempt={(attempt) => setAttempts((items) => [...items, attempt])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Practice</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Choose your next set</h1>
        <p className="mt-3 max-w-2xl text-slate-950/64">
          Pick a focused set, answer one question at a time, and use the timer to keep your pacing honest.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {modeOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setMode(value as PracticeMode)}
            className={`rounded-3xl p-5 text-left shadow-sm ${mode === value ? "bg-indigo-600 text-white" : "glass hover:bg-white/80"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-4 block font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <GlassCard strong className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Subject</span>
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={mode !== "subject"}
              className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 disabled:opacity-45"
            >
              {subjects.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Number of questions</span>
            <select
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3"
            >
              {[5, 10, 15, 25, 50].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <p className="text-sm leading-6 text-slate-950/58">
          {mode === "timed" ? "The timer keeps running until you finish the set." : "Feedback appears immediately after each answer."}
        </p>
        <button
          type="button"
          onClick={startSession}
          className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-700 md:w-auto"
        >
          Start Practice
        </button>
      </GlassCard>
    </div>
  );
}
