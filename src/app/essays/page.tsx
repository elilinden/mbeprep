import { FilePenLine, SlidersHorizontal } from "lucide-react";
import { randomUUID } from "node:crypto";
import type { ReactNode } from "react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { EssayLibraryFilters } from "@/domain/essay-types";
import { getLearnerProfile } from "@/server/onboarding-repository";
import {
  listEssayLibraryForUser,
  listEssayMetadata,
} from "@/server/essay-memory-store";

import { StartEssayForm } from "./start-essay-form";

type EssaysPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EssaysPage({ searchParams }: EssaysPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="essays" />;
  }

  const query = await searchParams;
  const filters = parseFilters(query);
  const essays = listEssayLibraryForUser({ userId: user.id, filters });
  const metadata = listEssayMetadata();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <FilePenLine aria-hidden="true" className="size-5 text-emerald-700" />
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Essay Library
            </p>
            <h1 className="text-2xl font-semibold text-stone-950">
              Timed Writing Practice
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Open a timed writing workspace, autosave your answer, submit when
          ready, and then review the secured sample answer and rubric.
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-5 text-emerald-700"
          />
          <h2 className="text-lg font-semibold text-stone-950">Filters</h2>
        </div>
        <form className="mt-5 grid gap-4 lg:grid-cols-4">
          <SelectFilter
            label="Exam track"
            name="examTrack"
            value={single(query?.examTrack)}
          >
            <option value="">Any</option>
            {metadata.examTracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter
            label="Subject"
            name="subject"
            value={single(query?.subject)}
          >
            <option value="">Any</option>
            {metadata.subjects.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </SelectFilter>
          <SelectFilter label="Topic" name="topic" value={single(query?.topic)}>
            <option value="">Any</option>
            {metadata.topics.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </SelectFilter>
          <SelectFilter label="Issue" name="issue" value={single(query?.issue)}>
            <option value="">Any</option>
            {metadata.issues.map((issue) => (
              <option key={issue}>{issue}</option>
            ))}
          </SelectFilter>
          <SelectFilter
            label="Source year"
            name="sourceYear"
            value={single(query?.sourceYear)}
          >
            <option value="">Any</option>
            {metadata.sourceYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter
            label="Difficulty"
            name="difficulty"
            value={single(query?.difficulty)}
          >
            <option value="">Any</option>
            {metadata.difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </SelectFilter>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
            <input
              defaultChecked={single(query?.completed) === "on"}
              name="completed"
              type="checkbox"
            />
            Completed
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
            <input
              defaultChecked={single(query?.uncompleted) === "on"}
              name="uncompleted"
              type="checkbox"
            />
            Uncompleted
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
            <input
              defaultChecked={single(query?.fullAnswer) === "on"}
              name="fullAnswer"
              type="checkbox"
            />
            Full answer
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
            <input
              defaultChecked={single(query?.outlineOnly) === "on"}
              name="outlineOnly"
              type="checkbox"
            />
            Outline only
          </label>
          <div className="flex items-end">
            <Button type="submit">Apply filters</Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-950">Essays</h2>
        {essays.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {essays.map((essay) => (
              <article
                className="rounded-md border border-stone-200 p-4"
                key={essay.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-stone-500">
                      {essay.examTrack} · {essay.subject} · {essay.topic}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-950">
                      {essay.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {essay.issue} · {essay.sourceYear} · {essay.difficulty} ·{" "}
                      {essay.baseTimerMinutes} minute base timer
                    </p>
                  </div>
                  <StartEssayForm
                    completed={essay.completed}
                    essayVersionId={essay.id}
                    startIntentId={randomUUID()}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="No demonstration essays match these filters."
            icon={FilePenLine}
            title="No essays"
          />
        )}
      </section>
    </div>
  );
}

function SelectFilter({
  children,
  label,
  name,
  value,
}: {
  children: ReactNode;
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-800">
      {label}
      <select
        className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
        defaultValue={value ?? ""}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

function parseFilters(
  query: Record<string, string | string[] | undefined> | undefined,
): EssayLibraryFilters {
  return {
    examTrack: nonEmpty(single(query?.examTrack)) as
      | EssayLibraryFilters["examTrack"]
      | undefined,
    subject: nonEmpty(single(query?.subject)),
    topic: nonEmpty(single(query?.topic)),
    issue: nonEmpty(single(query?.issue)),
    sourceYear: nonEmpty(single(query?.sourceYear))
      ? Number(single(query?.sourceYear))
      : undefined,
    difficulty: nonEmpty(single(query?.difficulty)) as
      | EssayLibraryFilters["difficulty"]
      | undefined,
    completed: single(query?.completed) === "on",
    uncompleted: single(query?.uncompleted) === "on",
    fullAnswer: single(query?.fullAnswer) === "on",
    outlineOnly: single(query?.outlineOnly) === "on",
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function nonEmpty(value: string | undefined) {
  return value?.trim() ? value : undefined;
}
