"use client";

import { BookOpenCheck, ListChecks, Target, type LucideIcon } from "lucide-react";
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
  { value: "mixed", label: "Practice Questions", icon: ListChecks },
  { value: "weak", label: "Weak Areas", icon: Target },
  { value: "saved", label: "Saved Questions", icon: BookOpenCheck }
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

function matchesDifficulty(question: Question, difficulty: string) {
  return difficulty === "all" || question.difficulty.toUpperCase() === difficulty;
}

function difficultySummary(difficulty: string) {
  return difficulty === "all" ? "All difficulty levels" : `${difficulty[0]}${difficulty.slice(1).toLowerCase()} difficulty`;
}

function pickQuestions(mode: PracticeMode, subject: string, difficulty: string, count: number, targetId?: string, subtopic?: string, targetIds: string[] = []): Question[] {
  const progress = getProgress();

  if (targetId) {
    return questions.filter((question) => question.id === targetId);
  }

  if (targetIds.length) {
    const requested = new Set(targetIds);
    return questions.filter((question) => requested.has(question.id));
  }

  if (mode === "weak") {
    const weakSet = recommendQuestions(progress, count * 2).filter((question) => (
      (!subtopic || question.subtopic === subtopic) && matchesDifficulty(question, difficulty)
    ));
    return shuffle(weakSet).slice(0, count);
  }

  if (mode === "saved") {
    const saved = questions.filter((question) => (
      progress.savedQuestionIds.includes(question.id) && matchesDifficulty(question, difficulty)
    ));
    return shuffle(saved).slice(0, count);
  }

  if ((mode === "mixed" || mode === "subject") && subject) {
    return shuffle(questions.filter((question) => question.subject === subject && matchesDifficulty(question, difficulty))).slice(0, count);
  }

  return shuffle(questions.filter((question) => matchesDifficulty(question, difficulty))).slice(0, count);
}

function practiceModeSummary(mode: PracticeMode, subject: string) {
  if (mode === "mixed" || mode === "subject") {
    return subject || "Mixed from all subjects";
  }

  if (mode === "weak") {
    return "Weak areas";
  }

  if (mode === "saved") {
    return "Saved questions";
  }

  return "Mixed from all subjects";
}

export function PracticeClient() {
  const params = useSearchParams();
  const requestedId = params.get("question") || undefined;
  const requestedIds = (params.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const rawRequestedMode = params.get("mode");
  const requestedMode: PracticeMode = rawRequestedMode === "weak" || rawRequestedMode === "saved"
    ? rawRequestedMode
    : requestedId
      ? "single"
      : "mixed";
  const requestedSubtopic = params.get("subtopic") || undefined;
  const requestedSubject = params.get("subject") || "";
  const subjects = getSubjects();

  const [mode, setMode] = useState<PracticeMode>(requestedMode);
  const [subject, setSubject] = useState(requestedSubject);
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(10);
  const [started, setStarted] = useState(Boolean(requestedId || requestedSubtopic || requestedIds.length));
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() => (
    requestedId || requestedSubtopic || requestedIds.length ? pickQuestions(requestedMode, subject, "all", count, requestedId, requestedSubtopic, requestedIds) : []
  ));
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const current = sessionQuestions[index];
  const [progressVersion, setProgressVersion] = useState(0);
  const savedQuestionCount = useMemo(() => (
    getProgress().savedQuestionIds.length
  ), [progressVersion]);
  const visibleModeOptions = modeOptions.filter((option) => (
    option.value !== "saved" || savedQuestionCount > 0
  ));
  const practiceSummary = `${count} questions · ${practiceModeSummary(mode, subject)} · ${difficultySummary(difficulty)} · Timed · Explanations after each answer`;
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

  useEffect(() => {
    function refreshProgress() {
      setProgressVersion((version) => version + 1);
    }

    refreshProgress();
    window.addEventListener("mbe-progress-updated", refreshProgress);
    return () => window.removeEventListener("mbe-progress-updated", refreshProgress);
  }, []);

  useEffect(() => {
    if (mode === "saved" && savedQuestionCount === 0) {
      setMode("mixed");
    }
  }, [mode, savedQuestionCount]);

  function startSession() {
    const picked = pickQuestions(mode, subject, difficulty, count, requestedId, requestedSubtopic, requestedIds);
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
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Start a Practice Set</h1>
        <p className="mt-3 max-w-2xl text-slate-950/64">
          Pick a focused set, answer one question at a time, and use the timer to keep your pacing honest.
        </p>
      </div>

      <div className={`grid grid-cols-2 gap-3 ${visibleModeOptions.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {visibleModeOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setMode(value as PracticeMode)}
            className={`rounded-3xl p-4 text-left shadow-sm sm:p-5 ${mode === value ? "bg-indigo-600 text-white" : "glass hover:bg-white/80"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-4 block font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <GlassCard strong className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-3">
          {mode === "mixed" || mode === "subject" ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-950/62">Subjects</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3"
              >
                <option value="">Mixed from all subjects</option>
                {subjects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          ) : (
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-950/62">Questions</span>
              <div className="rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-950">
                {mode === "weak" ? "Recommended weak topics" : "Saved questions"}
              </div>
            </div>
          )}
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3"
            >
              <option value="all">All levels</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
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
        <p className="text-sm leading-6 text-slate-950/58">{practiceSummary}</p>
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
