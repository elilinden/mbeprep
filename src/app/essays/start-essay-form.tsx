"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  startEssayAttemptWithStateAction,
  type EssayStartState,
} from "./actions";

type StartEssayFormProps = {
  essayVersionId: string;
  completed: boolean;
  startIntentId: string;
};

const initialState: EssayStartState = {};

export function StartEssayForm({
  essayVersionId,
  completed,
  startIntentId,
}: StartEssayFormProps) {
  const [state, formAction, pending] = useActionState(
    startEssayAttemptWithStateAction,
    initialState,
  );
  const statusMessage = pending
    ? "Opening your writing workspace..."
    : state.error
      ? state.error
      : "Sample answer and rubric stay locked until you submit.";

  return (
    <form action={formAction} className="space-y-2">
      <input name="essayVersionId" type="hidden" value={essayVersionId} />
      <input name="startIntentId" type="hidden" value={startIntentId} />
      <Button
        aria-describedby={`essay-start-status-${essayVersionId}`}
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
          ? "Opening workspace..."
          : state.error
            ? "Try again"
            : completed
              ? "Write again"
              : "Start essay"}
      </Button>
      <p
        aria-live="polite"
        className={
          state.error
            ? "flex max-w-xs items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            : "max-w-xs text-xs leading-5 text-stone-500"
        }
        id={`essay-start-status-${essayVersionId}`}
        role="status"
      >
        {state.error ? (
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        ) : null}
        {statusMessage}
      </p>
    </form>
  );
}
