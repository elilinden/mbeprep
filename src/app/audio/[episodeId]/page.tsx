import { notFound } from "next/navigation";
import {
  Bookmark,
  FileQuestion,
  FileText,
  RotateCcw,
  Search,
  SkipForward,
  StickyNote,
} from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getActiveTranscriptSegment } from "@/domain/transcript-search";
import { toStudentContentLabel } from "@/lib/student-content-labels";
import { getLearnerProfile } from "@/server/onboarding-repository";
import {
  findPodcastEpisode,
  getPodcastBookmarks,
  getPodcastNotes,
  getPodcastProgress,
} from "@/server/podcast-memory-store";
import { createPodcastStorageAdapter } from "@/server/storage/storage-adapter";

import {
  createPodcastBookmarkAction,
  createPodcastNoteAction,
  savePodcastProgressAction,
} from "../actions";
import { EpisodePlayer } from "./episode-player";

type EpisodePageProps = {
  params: Promise<{ episodeId: string }>;
  searchParams?: Promise<{ transcript?: string }>;
};

export default async function EpisodePage({
  params,
  searchParams,
}: EpisodePageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="audio" />;
  }

  const { episodeId } = await params;
  const query = (await searchParams)?.transcript?.trim().toLowerCase() ?? "";
  const episode = findPodcastEpisode(episodeId);

  if (!episode || episode.status !== "PUBLISHED") {
    notFound();
  }

  const storage = createPodcastStorageAdapter();
  const playback = await storage.createSignedPlaybackUrl({
    objectKey: episode.audioObjectKey,
  });
  const progress = getPodcastProgress(user.id, episode.id);
  const activeSegment = getActiveTranscriptSegment(
    episode.transcriptSegments,
    progress.positionSeconds,
  );
  const transcriptSegments = query
    ? episode.transcriptSegments.filter((segment) =>
        segment.text.toLowerCase().includes(query),
      )
    : episode.transcriptSegments;
  const bookmarks = getPodcastBookmarks(user.id, episode.id);
  const notes = getPodcastNotes(user.id, episode.id);
  const episodeTitle = toStudentContentLabel(episode.title);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <p className="text-sm font-medium text-emerald-700">
          {episode.subject}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-950">
          {episodeTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          {episode.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-600">
          <span>Instructor: {episode.instructor}</span>
          {episode.topics.map((topic) => (
            <span
              className="rounded-full bg-stone-100 px-2 py-1 text-stone-700"
              key={topic}
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <EpisodePlayer playbackUrl={playback.url} title={episodeTitle} />
          <p className="mt-3 text-sm text-stone-700">
            Resume at {progress.positionSeconds} seconds.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ProgressButton
              episodeId={episode.id}
              icon="back"
              label="Skip back 10 seconds"
              previous={progress.positionSeconds}
              target={Math.max(0, progress.positionSeconds - 10)}
            />
            <ProgressButton
              episodeId={episode.id}
              icon="forward"
              label="Skip forward 30 seconds"
              previous={progress.positionSeconds}
              target={Math.min(
                episode.durationSeconds,
                progress.positionSeconds + 30,
              )}
            />
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800">
              Speed
              <select
                aria-label="Playback speed"
                className="bg-transparent text-sm"
                defaultValue="1"
              >
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Keyboard controls are available through the native audio element and
            focused buttons.
          </p>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-950">Chapters</h2>
          <div className="mt-3 space-y-2">
            {episode.chapters.map((chapter) => (
              <form action={savePodcastProgressAction} key={chapter.id}>
                <input name="episodeId" type="hidden" value={episode.id} />
                <input
                  name="previousPositionSeconds"
                  type="hidden"
                  value={progress.positionSeconds}
                />
                <input
                  name="positionSeconds"
                  type="hidden"
                  value={chapter.startSeconds}
                />
                <Button
                  className="w-full justify-start"
                  type="submit"
                  variant="ghost"
                >
                  {chapter.title} · {chapter.startSeconds}s
                </Button>
              </form>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Search aria-hidden="true" className="size-5 text-emerald-700" />
            <h2 className="font-semibold text-stone-950">Transcript</h2>
          </div>
          <form className="mt-4">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Search transcript
              <input
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={query}
              name="transcript"
              placeholder="Search transcript"
            />
            </label>
          </form>
          {transcriptSegments.length > 0 ? (
            <div className="mt-4 space-y-3">
              {transcriptSegments.map((segment) => (
                <div
                  className={
                    segment.id === activeSegment?.id
                      ? "rounded-md border border-emerald-700 bg-emerald-50 p-3"
                      : "rounded-md border border-stone-200 p-3"
                  }
                  key={segment.id}
                >
                  <p className="text-xs font-medium text-stone-500">
                    {segment.startSeconds}s-{segment.endSeconds}s
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              description="A transcript has not been added for this audio yet."
              icon={FileText}
              title="Transcript pending"
            />
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Bookmark
                aria-hidden="true"
                className="size-4 text-emerald-700"
              />
              <h2 className="font-semibold text-stone-950">Bookmarks</h2>
            </div>
            <form
              action={createPodcastBookmarkAction}
              className="mt-3 space-y-3"
            >
              <input name="episodeId" type="hidden" value={episode.id} />
              <input
                name="timestampSeconds"
                type="hidden"
                value={progress.positionSeconds}
              />
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Label
                <input
                  className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                  name="label"
                  placeholder="Timestamp bookmark"
                />
              </label>
              <Button type="submit" variant="secondary">
                Add bookmark
              </Button>
            </form>
            <div className="mt-3 space-y-2 text-sm text-stone-600">
              {bookmarks.map((bookmark) => (
                <p key={bookmark.id}>
                  {bookmark.timestampSeconds}s {bookmark.label}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <StickyNote
                aria-hidden="true"
                className="size-4 text-emerald-700"
              />
              <h2 className="font-semibold text-stone-950">Notes</h2>
            </div>
            <form action={createPodcastNoteAction} className="mt-3 space-y-3">
              <input name="episodeId" type="hidden" value={episode.id} />
              <input
                name="timestampSeconds"
                type="hidden"
                value={progress.positionSeconds}
              />
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Note
                <textarea
                  className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
                  name="body"
                  placeholder="Add a note"
                  required
                />
              </label>
              <Button type="submit" variant="secondary">
                Add note
              </Button>
            </form>
            <div className="mt-3 space-y-2 text-sm text-stone-600">
              {notes.map((note) => (
                <p key={note.id}>
                  {note.timestampSeconds}s {note.body}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RelatedContent
          emptyDescription="Related question links appear after reviewed content is connected."
          icon="question"
          items={episode.relatedQuestions.map((question) => question.id)}
          title="Related Questions"
        />
        <RelatedContent
          emptyDescription="Related essay links appear after reviewed content is connected."
          icon="essay"
          items={episode.relatedEssays.map((essay) => essay.id)}
          title="Related Essays"
        />
      </section>
    </div>
  );
}

function ProgressButton({
  episodeId,
  label,
  previous,
  target,
  icon,
}: {
  episodeId: string;
  label: string;
  previous: number;
  target: number;
  icon: "back" | "forward";
}) {
  const Icon = icon === "back" ? RotateCcw : SkipForward;

  return (
    <form action={savePodcastProgressAction}>
      <input name="episodeId" type="hidden" value={episodeId} />
      <input name="previousPositionSeconds" type="hidden" value={previous} />
      <input name="positionSeconds" type="hidden" value={target} />
      <Button aria-label={label} type="submit" variant="secondary">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </Button>
    </form>
  );
}

function RelatedContent({
  title,
  items,
  icon,
  emptyDescription,
}: {
  title: string;
  items: string[];
  icon: "question" | "essay";
  emptyDescription: string;
}) {
  const Icon = icon === "question" ? FileQuestion : FileText;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 text-emerald-700" />
        <h2 className="font-semibold text-stone-950">{title}</h2>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <p className="text-sm text-stone-700" key={item}>
              {item}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState
          description={emptyDescription}
          icon={Icon}
          title="None yet"
        />
      )}
    </section>
  );
}
