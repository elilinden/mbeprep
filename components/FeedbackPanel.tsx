"use client";

import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { Question } from "@/lib/types";
import { GlassCard } from "@/components/GlassCard";

type FeedbackPanelProps = {
  question: Question;
  selectedChoice: string;
};

export function FeedbackPanel({ question, selectedChoice }: FeedbackPanelProps) {
  const selected = question.choices.find((choice) => choice.label === selectedChoice);
  const correct = Boolean(selected && (selected.isCorrect || selected.label === question.correctChoice));

  return (
    <GlassCard strong className="space-y-5">
      <div className="flex items-start gap-3">
        <span className={`mt-1 rounded-2xl p-2 ${correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
          {correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900/55">
            {correct ? "Correct" : "Not quite"}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {correct ? "You found the best answer." : "This is a common trap."}
          </h2>
          <p className="mt-2 text-slate-950/70">
            Correct answer: <span className="font-semibold">{question.correctChoice}</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white/62 p-5">
        <div className="flex gap-3">
          <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <p className="font-semibold">Here&apos;s the rule to remember.</p>
            <p className="mt-2 leading-7 text-slate-950/76">{question.explanation.testedIssue}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <details className="rounded-2xl bg-white/58 p-4" open>
          <summary className="cursor-pointer font-semibold">Short explanation</summary>
          <p className="mt-3 leading-7 text-slate-950/74">{selected?.rationale || "Rationale unavailable."}</p>
        </details>
        <details className="rounded-2xl bg-white/58 p-4">
          <summary className="cursor-pointer font-semibold">Full rule</summary>
          <p className="mt-3 leading-7 text-slate-950/74">{question.explanation.governingRule}</p>
        </details>
        <details className="rounded-2xl bg-white/58 p-4">
          <summary className="cursor-pointer font-semibold">Application</summary>
          <p className="mt-3 leading-7 text-slate-950/74">{question.explanation.application}</p>
        </details>
        <details className="rounded-2xl bg-white/58 p-4">
          <summary className="cursor-pointer font-semibold">Common trap</summary>
          <p className="mt-3 leading-7 text-slate-950/74">{question.explanation.commonTrap}</p>
        </details>
        <details className="rounded-2xl bg-white/58 p-4">
          <summary className="cursor-pointer font-semibold">Memory aid</summary>
          <p className="mt-3 leading-7 text-slate-950/74">{question.explanation.memoryAid}</p>
        </details>
        <details className="rounded-2xl bg-white/58 p-4">
          <summary className="cursor-pointer font-semibold">Authority notes</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-950/74">
            {question.authorityNotes.length ? question.authorityNotes.map((note) => <li key={note}>{note}</li>) : <li>No authority notes provided.</li>}
          </ul>
        </details>
      </div>

      <details className="rounded-2xl bg-white/60 p-4">
        <summary className="cursor-pointer font-semibold">Why each answer choice works or fails</summary>
        <div className="mt-4 space-y-3">
          {question.choices.map((choice) => (
            <div key={choice.label} className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">
                {choice.label}. {choice.isCorrect ? "Correct" : "Wrong answer"}
              </p>
              <p className="mt-2 leading-7 text-slate-950/72">{choice.rationale}</p>
            </div>
          ))}
        </div>
      </details>
    </GlassCard>
  );
}
