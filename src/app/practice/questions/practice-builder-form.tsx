"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatExamTrackLabel } from "@/domain/practice-track";
import type { ExamTrackCode } from "@/domain/exam-track";

import {
  createPracticeSessionWithStateAction,
  type PracticeStartState,
} from "./actions";

type PracticeBuilderMetadata = {
  subjects: string[];
  categories: string[];
  subtopics: string[];
};

type PracticeBuilderFormProps = {
  examTrack: ExamTrackCode;
  metadata: PracticeBuilderMetadata;
  startIntentId: string;
};

const initialState: PracticeStartState = {};

export function PracticeBuilderForm({
  examTrack,
  metadata,
  startIntentId,
}: PracticeBuilderFormProps) {
  const [state, formAction, pending] = useActionState(
    createPracticeSessionWithStateAction,
    initialState,
  );
  const statusMessage = pending
    ? "Creating your practice set..."
    : state.error
      ? state.error
      : `Practice will use your confirmed ${formatExamTrackLabel(examTrack)} track.`;

  return (
    <form action={formAction} className="mt-5 grid gap-4 lg:grid-cols-3">
      <input name="startIntentId" type="hidden" value={startIntentId} />
      <input name="examTrack" type="hidden" value={examTrack} />
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Session mode
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="mode"
        >
          <option value="LEARNING">Learning</option>
          <option value="EXAM">Exam</option>
          <option value="CUSTOM">Custom</option>
          <option value="ADAPTIVE">Adaptive</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Exam track
        <input
          aria-describedby="practice-track-note"
          className="min-h-10 rounded-md border border-stone-300 bg-stone-50 px-3 text-sm text-stone-800"
          readOnly
          value={formatExamTrackLabel(examTrack)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Subject
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="subject"
        >
          <option value="">Any</option>
          {metadata.subjects.map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Category
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="category"
        >
          <option value="">Any</option>
          {metadata.categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Subtopic
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="subtopic"
        >
          <option value="">Any</option>
          {metadata.subtopics.map((subtopic) => (
            <option key={subtopic}>{subtopic}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Number of questions
        <input
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          defaultValue="2"
          min="1"
          name="questionCount"
          type="number"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Difficulty
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="difficulty"
        >
          <option value="">Any</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Timing
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="timingMode"
        >
          <option value="UNTIMED">Untimed</option>
          <option value="TIMED">Timed</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Feedback
        <select
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
          name="feedbackMode"
        >
          <option value="IMMEDIATE">Immediate</option>
          <option value="END_OF_SET">End of set</option>
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium text-stone-800">
        Filters
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3">
          <input name="unseen" type="checkbox" />
          Unseen
        </label>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3">
          <input name="incorrect" type="checkbox" />
          Incorrect
        </label>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3">
          <input name="bookmarked" type="checkbox" />
          Bookmarked
        </label>
      </div>
      <div className="flex flex-col justify-end gap-2 lg:col-span-2">
        <p
          aria-live="polite"
          className={
            state.error
              ? "flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              : "text-sm text-stone-600"
          }
          id="practice-start-status"
          role="status"
        >
          {state.error ? (
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          ) : null}
          {statusMessage}
        </p>
        <p className="text-xs leading-5 text-stone-500" id="practice-track-note">
          Change exam track from onboarding settings so ordinary sessions do not
          mix Legacy UBE and NextGen UBE content.
        </p>
        <div>
          <Button
            aria-describedby="practice-start-status practice-track-note"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <Loader2
                aria-hidden="true"
                className="size-4 motion-safe:animate-spin"
              />
            ) : null}
            {pending
              ? "Creating practice set..."
              : state.error
                ? "Try again"
                : "Start practice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
