"use client";

import { clsx } from "clsx";
import type { Choice } from "@/lib/types";

type AnswerChoiceProps = {
  choice: Choice;
  correctChoice: string;
  selected?: boolean;
  revealed?: boolean;
  onSelect: (label: string) => void;
};

export function AnswerChoice({ choice, correctChoice, selected, revealed, onSelect }: AnswerChoiceProps) {
  const displayLabel = choice.label || "?";
  const correctByKey = choice.isCorrect || choice.label === correctChoice;
  const isCorrect = revealed && correctByKey;
  const isWrongSelected = revealed && selected && !correctByKey;
  const buttonStateClass = isCorrect
    ? "border-emerald-600 bg-emerald-100 ring-4 ring-emerald-500/25 shadow-lg shadow-emerald-900/10"
    : isWrongSelected
      ? "border-red-500 bg-red-100 ring-4 ring-red-500/25 shadow-lg shadow-red-900/10"
      : selected && !revealed
        ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-500/12"
        : "border-slate-200 bg-white/72";
  const labelStateClass = isCorrect
    ? "border-emerald-700 bg-emerald-700 text-white"
    : isWrongSelected
      ? "border-red-700 bg-red-600 text-white"
      : "border-slate-200 bg-white/88 text-slate-950";

  return (
    <button
      type="button"
      onClick={() => onSelect(displayLabel)}
      className={clsx(
        "group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white/92",
        buttonStateClass
      )}
      aria-pressed={selected}
    >
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold",
          labelStateClass
        )}
      >
        {displayLabel}
      </span>
      <span className="pt-1 text-[15px] leading-7 text-slate-950/86">{choice.text}</span>
    </button>
  );
}
