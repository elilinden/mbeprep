"use client";

import { Lightbulb, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { submitSuggestion } from "@/lib/suggestions";

const suggestionTypes = [
  "General feedback",
  "Question issue",
  "Missing subject",
  "Feature idea",
  "Bug report"
];

export function SuggestionsClient() {
  const [type, setType] = useState(suggestionTypes[0]);
  const [page, setPage] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("sending");

    try {
      await submitSuggestion({ type, page, message });
      setMessage("");
      setPage("");
      setStatus("sent");
    } catch (suggestionError) {
      setStatus("idle");
      setError(suggestionError instanceof Error ? suggestionError.message : "Could not send that suggestion.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Suggestions</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Help improve MBE Prep</h1>
        <p className="mt-3 max-w-2xl text-slate-950/64">
          Send ideas, fixes, missing subjects, or anything that would make studying easier.
        </p>
      </div>

      <GlassCard strong>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-950/62">Type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 outline-none focus:border-indigo-400"
              >
                {suggestionTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-950/62">Page or topic</span>
              <input
                value={page}
                onChange={(event) => setPage(event.target.value)}
                placeholder="Questions, Contracts, podcasts..."
                className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Suggestion</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What should be fixed, added, or improved?"
              required
              minLength={8}
              className="min-h-48 w-full resize-y rounded-2xl border border-slate-200 bg-white/78 p-4 leading-7 outline-none focus:border-indigo-400"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {status === "sent" ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
              Thanks. Your suggestion was sent.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-950/58">
              <Lightbulb className="h-4 w-4 text-indigo-600" />
              Short, specific notes are easiest to act on.
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send className="mr-2 inline h-4 w-4" />
              {status === "sending" ? "Sending..." : "Send suggestion"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
