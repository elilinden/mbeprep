"use client";

import { Bookmark, Brain, Clock, Flag, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnswerChoice } from "@/components/AnswerChoice";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { GlassCard } from "@/components/GlassCard";
import { saveAttempt, updateQuestionStats } from "@/lib/progress";
import type { Attempt, Question } from "@/lib/types";

type QuestionCardProps = {
  question: Question;
  index: number;
  total: number;
  elapsed: number;
  onNext: () => void;
  onEnd: () => void;
  onAttempt?: (attempt: Attempt) => void;
};

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function QuestionCard({ question, index, total, elapsed, onNext, onEnd, onAttempt }: QuestionCardProps) {
  const [selectedChoice, setSelectedChoice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [guessed, setGuessed] = useState(false);
  const [markedConfusing, setMarkedConfusing] = useState(false);
  const [saved, setSaved] = useState(false);
  const startedAtRef = useRef(0);
  const progressHeaderRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [question.id]);

  useEffect(() => {
    if (!submitted) {
      return;
    }

    window.setTimeout(() => {
      const feedbackTop = feedbackRef.current?.getBoundingClientRect().top;

      if (feedbackTop === undefined) {
        return;
      }

      const appHeaderHeight = document.querySelector("header")?.getBoundingClientRect().height || 0;
      const progressHeaderHeight = progressHeaderRef.current?.getBoundingClientRect().height || 0;
      const scrollOffset = appHeaderHeight + progressHeaderHeight + 28;

      window.scrollTo({
        top: window.scrollY + feedbackTop - scrollOffset,
        behavior: "smooth"
      });
    }, 80);
  }, [submitted]);

  function submit(label: string) {
    if (submitted) return;

    const selected = question.choices.find((choice) => choice.label === label);
    const isCorrect = Boolean(selected && (selected.isCorrect || selected.label === question.correctChoice));
    const attempt: Attempt = {
      questionId: question.id,
      selectedChoice: label,
      correctChoice: question.correctChoice,
      isCorrect,
      subject: question.subject,
      category: question.category,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      timestamp: new Date().toISOString(),
      timeSpent: Math.max(1, Math.round((Date.now() - (startedAtRef.current || Date.now())) / 1000)),
      guessed,
      markedConfusing
    };

    setSelectedChoice(label);
    setSubmitted(true);
    saveAttempt(attempt);
    onAttempt?.(attempt);
  }

  function next() {
    setSelectedChoice("");
    setSubmitted(false);
    setGuessed(false);
    setMarkedConfusing(false);
    setSaved(false);
    onNext();
  }

  function saveForReview() {
    setSaved(true);
    updateQuestionStats(question.id, true);
  }

  return (
    <div className="space-y-5">
      <div ref={progressHeaderRef} className="glass sticky top-24 z-20 rounded-3xl px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-950/62">Question {index + 1} of {total}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/70 md:w-80">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-950/68">
            <span className="rounded-full bg-white/70 px-3 py-2">{question.subject}</span>
            <span className="rounded-full bg-white/70 px-3 py-2">{question.difficulty}</span>
            <span className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-2">
              <Clock className="h-3.5 w-3.5" />
              {formatElapsed(elapsed)}
            </span>
          </div>
        </div>
      </div>

      <GlassCard strong className="space-y-6">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900/55">
          <span className="rounded-full bg-indigo-50 px-3 py-1.5">{question.category}</span>
          <span className="rounded-full bg-white/68 px-3 py-1.5">{question.subtopic}</span>
        </div>
        <div className="space-y-4">
          <p className="text-lg leading-8 text-slate-950/86">{question.stem}</p>
          <p className="rounded-3xl bg-white/62 p-5 text-lg font-semibold leading-8 text-slate-950">{question.call}</p>
        </div>
        <div className="space-y-3">
          {question.choices.map((choice) => (
            <AnswerChoice
              key={choice.label}
              choice={choice}
              correctChoice={question.correctChoice}
              selected={selectedChoice === choice.label}
              revealed={submitted}
              onSelect={submit}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGuessed((value) => !value)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${guessed ? "bg-amber-200 text-amber-950" : "bg-white/68 text-slate-950/70 hover:bg-white"}`}
          >
            <Flag className="mr-2 inline h-4 w-4" />
            Mark as Guessed
          </button>
          <button
            type="button"
            onClick={() => setMarkedConfusing((value) => !value)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${markedConfusing ? "bg-red-100 text-red-700" : "bg-white/68 text-slate-950/70 hover:bg-white"}`}
          >
            <HelpCircle className="mr-2 inline h-4 w-4" />
            I don&apos;t understand this
          </button>
          <button
            type="button"
            onClick={saveForReview}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${saved ? "bg-indigo-50 text-indigo-700" : "bg-white/68 text-slate-950/70 hover:bg-white"}`}
          >
            <Bookmark className="mr-2 inline h-4 w-4" />
            Save for Review
          </button>
        </div>
      </GlassCard>

      {submitted ? (
        <div ref={feedbackRef}>
          <FeedbackPanel question={question} selectedChoice={selectedChoice} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onEnd}
          className="rounded-2xl bg-white/70 px-5 py-3 font-semibold text-slate-950/70 hover:bg-white"
        >
          End Session
        </button>
        {submitted ? (
          <button
            type="button"
            onClick={next}
            className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-700"
          >
            <Brain className="mr-2 inline h-4 w-4" />
            Next Question
          </button>
        ) : null}
      </div>
    </div>
  );
}
