"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Expand, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SafeEssayWorkspace } from "@/domain/essay-types";

type ServerAction = (formData: FormData) => void | Promise<void>;

export function EssayWorkspaceClient({
  autosaveAction,
  saved,
  submitAction,
  workspace,
}: {
  autosaveAction: ServerAction;
  saved: boolean;
  submitAction: ServerAction;
  workspace: SafeEssayWorkspace;
}) {
  const [outline, setOutline] = useState(workspace.outline);
  const [answer, setAnswer] = useState(workspace.answer);
  const [timerMinutes, setTimerMinutes] = useState(workspace.timerMinutes);
  const [fullScreen, setFullScreen] = useState(false);
  const [localStatus, setLocalStatus] = useState("Local backup ready");
  const [clientSavedAt, setClientSavedAt] = useState(new Date().toISOString());
  const storageKey = `mbeprep:essay:${workspace.attemptId}`;
  const wordCount = useMemo(() => countWords(answer), [answer]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    try {
      const local = JSON.parse(raw) as {
        outline?: string;
        answer?: string;
        savedAt?: string;
      };
      const localSavedAt = local.savedAt ? new Date(local.savedAt) : null;
      const serverSavedAt = workspace.autosavedAt
        ? new Date(workspace.autosavedAt)
        : null;
      const localIsNewer =
        localSavedAt &&
        (!serverSavedAt || localSavedAt.getTime() > serverSavedAt.getTime());

      if (localIsNewer) {
        window.setTimeout(() => {
          setOutline(local.outline ?? "");
          setAnswer(local.answer ?? "");
          setLocalStatus("Restored newer local browser backup");
        }, 0);
      }
    } catch {
      window.setTimeout(() => {
        setLocalStatus("Local backup could not be restored");
      }, 0);
    }
  }, [storageKey, workspace.autosavedAt]);

  function saveLocalBackup(nextOutline: string, nextAnswer: string) {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        outline: nextOutline,
        answer: nextAnswer,
        savedAt,
      }),
    );
    setClientSavedAt(savedAt);
    setLocalStatus("Local backup saved");
  }

  function confirmSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;

    if (submitter?.value !== "submit") {
      return;
    }

    if (!window.confirm("Submit this essay for review?")) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={submitAction}
      className={
        fullScreen
          ? "fixed inset-0 z-50 overflow-auto bg-stone-50 p-4 md:p-8"
          : "space-y-6"
      }
      onSubmit={confirmSubmit}
    >
      <input name="attemptId" type="hidden" value={workspace.attemptId} />
      <input name="clientSavedAt" type="hidden" value={clientSavedAt} />
      <input
        name="idempotencyKey"
        type="hidden"
        value={`${workspace.attemptId}-submit`}
      />

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {workspace.subject} · {workspace.topic}
            </p>
            <h1 className="text-2xl font-semibold text-stone-950">
              {workspace.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
              Timer
              <input
                className="w-20 rounded border border-stone-300 px-2 py-1"
                min="1"
                onChange={(event) =>
                  setTimerMinutes(Number(event.target.value))
                }
                type="number"
                value={timerMinutes}
              />
            </label>
            <button
              aria-pressed={fullScreen}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800"
              onClick={() => setFullScreen((value) => !value)}
              type="button"
            >
              <Expand aria-hidden="true" className="size-4" />
              Full screen
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-4">
          <Status label="Timer" value={`${timerMinutes} minutes`} />
          <Status
            label="Accommodation"
            value={`${workspace.extendedTimeMultiplier}x`}
          />
          <Status label="Word count" value={String(wordCount)} />
          <Status
            label="Autosave"
            value={saved ? "Server saved" : localStatus}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">Prompt</h2>
          <p className="mt-4 text-sm leading-7 text-stone-700">
            {workspace.prompt}
          </p>
          <h3 className="mt-5 font-semibold text-stone-950">
            Calls of the Question
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-700">
            {workspace.callsOfQuestion.map((call) => (
              <li key={call}>{call}</li>
            ))}
          </ol>
        </article>

        <article className="space-y-4">
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Outline
            <textarea
              className="min-h-40 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6"
              name="outline"
              onChange={(event) => {
                const nextOutline = event.target.value;
                setOutline(nextOutline);
                saveLocalBackup(nextOutline, answer);
              }}
              value={outline}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Answer
            <textarea
              className="min-h-96 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6"
              name="answer"
              onChange={(event) => {
                const nextAnswer = event.target.value;
                setAnswer(nextAnswer);
                saveLocalBackup(outline, nextAnswer);
              }}
              value={answer}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              formAction={autosaveAction}
              type="submit"
              value="autosave"
              variant="secondary"
            >
              <Save aria-hidden="true" className="size-4" />
              Save draft
            </Button>
            <Button type="submit" value="submit">
              <Send aria-hidden="true" className="size-4" />
              Submit essay
            </Button>
          </div>
        </article>
      </section>
    </form>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
