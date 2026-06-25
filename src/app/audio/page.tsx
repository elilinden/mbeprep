import Link from "next/link";
import type { Route } from "next";
import { Headphones, Search } from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/ui/status-card";
import { searchPodcastLibrary } from "@/domain/podcast-library";
import { toStudentContentLabel } from "@/lib/student-content-labels";
import { getLearnerProfile } from "@/server/onboarding-repository";
import {
  getPodcastProgress,
  listPublishedPodcastEpisodes,
} from "@/server/podcast-memory-store";

type AudioPageProps = {
  searchParams?: Promise<{
    q?: string;
    subject?: string;
    topic?: string;
  }>;
};

export default async function AudioPage({ searchParams }: AudioPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="audio" />;
  }

  const params = await searchParams;
  const episodes = listPublishedPodcastEpisodes();
  const filteredEpisodes = searchPodcastLibrary(episodes, {
    query: params?.q,
    subject: params?.subject,
    topic: params?.topic,
  });
  const continueListening = episodes
    .map((episode) => ({
      episode,
      progress: getPodcastProgress(user.id, episode.id),
    }))
    .filter((item) => item.progress.positionSeconds > 0);
  const subjects = [...new Set(episodes.map((episode) => episode.subject))];
  const topics = [...new Set(episodes.flatMap((episode) => episode.topics))];

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Headphones aria-hidden="true" className="size-5 text-emerald-700" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Audio</p>
            <h1 className="text-2xl font-semibold text-stone-950">
              Podcast Library
            </h1>
          </div>
        </div>
        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_14rem_14rem_auto]">
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Search title or transcript
            <input
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={params?.q}
              name="q"
              placeholder="Search episodes"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Subject
            <select
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={params?.subject}
              name="subject"
            >
              <option value="">All</option>
              {subjects.map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Topic
            <select
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={params?.topic}
              name="topic"
            >
              <option value="">All</option>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </label>
          <button className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white">
            <Search aria-hidden="true" className="size-4" />
            Search
          </button>
        </form>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          description={`${episodes.length} episode${episodes.length === 1 ? "" : "s"} available`}
          eyebrow="Library"
          title="Available"
        />
        <StatusCard
          description={`${continueListening.length} in progress`}
          eyebrow="Progress"
          title="Continue listening"
        />
        <StatusCard
          description="Listening progress is tracked separately from mastery."
          eyebrow="Mastery"
          title="No inference"
        />
      </div>

      {continueListening.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-stone-950">
            Continue Listening
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {continueListening.map(({ episode, progress }) => (
              <article
                className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-emerald-700 focus-within:border-emerald-700"
                key={episode.id}
              >
                <h3 className="font-medium text-stone-950">
                  <Link
                    className="rounded-sm underline decoration-emerald-700 decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                    href={`/audio/${episode.id}` as Route}
                  >
                    {toStudentContentLabel(episode.title)}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  Resume at {progress.positionSeconds} seconds.
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Episodes</h2>
        {filteredEpisodes.length > 0 ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {filteredEpisodes.map((episode) => {
              const progress = getPodcastProgress(user.id, episode.id);

              return (
                <article
                  className="rounded-lg border border-stone-200 bg-white p-5 transition-colors hover:border-emerald-700 focus-within:border-emerald-700"
                  key={episode.id}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-700">
                    <span>{episode.subject}</span>
                    {episode.topics.map((topic) => (
                      <span
                        className="rounded-full bg-stone-100 px-2 py-1 text-stone-700"
                        key={topic}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-stone-950">
                    <Link
                      className="rounded-sm underline decoration-emerald-700 decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                      href={`/audio/${episode.id}` as Route}
                    >
                      {toStudentContentLabel(episode.title)}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {episode.summary}
                  </p>
                  <p className="mt-3 text-sm text-stone-700">
                    {progress.completed
                      ? "Completed"
                      : `Resume at ${progress.positionSeconds} seconds`}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            description="No published demonstration episodes match the current filters."
            icon={Headphones}
            title="No episodes"
          />
        )}
      </section>
    </div>
  );
}
