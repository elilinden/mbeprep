"use client";

import { Bookmark, Headphones, NotebookPen, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { hydratePodcastStateFromCloud, savePodcastBookmarkToCloud, savePodcastNoteToCloud } from "@/lib/cloudStudy";
import type { PodcastEpisode } from "@/lib/types";
import { readJsonStorage, scopedStorageKey, writeJsonStorage } from "@/lib/userStorage";

type PodcastNote = {
  episodeId: string;
  note: string;
  updatedAt: string;
};

const notesBaseKey = "mbe-prep-podcast-notes-v1";
const bookmarkBaseKey = "mbe-prep-podcast-bookmarks-v1";

export function PodcastsClient({ episodes }: { episodes: PodcastEpisode[] }) {
  const [selectedId, setSelectedId] = useState(episodes[0]?.id || "");
  const [notes, setNotes] = useState<Record<string, PodcastNote>>(() => readJsonStorage(scopedStorageKey(notesBaseKey), {}));
  const [bookmarks, setBookmarks] = useState<string[]>(() => readJsonStorage(scopedStorageKey(bookmarkBaseKey), []));

  useEffect(() => {
    let active = true;
    const loadStoredAudioState = window.setTimeout(() => {
      const localNotes = readJsonStorage<Record<string, PodcastNote>>(scopedStorageKey(notesBaseKey), {});
      const localBookmarks = readJsonStorage<string[]>(scopedStorageKey(bookmarkBaseKey), []);
      setNotes(localNotes);
      setBookmarks(localBookmarks);

      void hydratePodcastStateFromCloud(localNotes, localBookmarks).then((cloudState) => {
        if (!active) {
          return;
        }

        setNotes(cloudState.notes);
        setBookmarks(cloudState.bookmarks);
        writeJsonStorage(scopedStorageKey(notesBaseKey), cloudState.notes);
        writeJsonStorage(scopedStorageKey(bookmarkBaseKey), cloudState.bookmarks);
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadStoredAudioState);
    };
  }, []);

  const selected = useMemo(
    () => episodes.find((episode) => episode.id === selectedId) || episodes[0],
    [episodes, selectedId]
  );

  function saveNote(value: string) {
    if (!selected) {
      return;
    }

    const next = {
      ...notes,
      [selected.id]: {
        episodeId: selected.id,
        note: value,
        updatedAt: new Date().toISOString()
      }
    };
    setNotes(next);
    writeJsonStorage(scopedStorageKey(notesBaseKey), next);
    void savePodcastNoteToCloud(next[selected.id]);
  }

  function toggleBookmark() {
    if (!selected) {
      return;
    }

    const next = bookmarks.includes(selected.id)
      ? bookmarks.filter((id) => id !== selected.id)
      : [...bookmarks, selected.id];
    setBookmarks(next);
    writeJsonStorage(scopedStorageKey(bookmarkBaseKey), next);
    void savePodcastBookmarkToCloud(selected.id, !bookmarks.includes(selected.id));
  }

  if (!episodes.length || !selected) {
    return (
      <GlassCard>
        <h1 className="text-3xl font-semibold tracking-tight">Podcasts</h1>
        <p className="mt-3 text-slate-950/62">No podcast files were found.</p>
      </GlassCard>
    );
  }

  const selectedNote = notes[selected.id]?.note || "";
  const bookmarked = bookmarks.includes(selected.id);

  return (
    <div className="space-y-6">
      <div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Podcasts</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Listen by topic</h1>
          <p className="mt-3 max-w-2xl text-slate-950/64">
            Keep a calm audio pass open while you review rules and save notes for later.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <GlassCard className="space-y-3">
          <h2 className="text-xl font-semibold">Library</h2>
          {episodes.map((episode) => {
            const active = selected.id === episode.id;
            return (
              <button
                key={episode.id}
                type="button"
                onClick={() => setSelectedId(episode.id)}
                className={`w-full rounded-3xl border-2 p-4 text-left transition ${
                  active
                    ? "border-indigo-300 bg-indigo-50/80 shadow-sm"
                    : "border-transparent bg-white/62 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white/86"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">{episode.subject}</p>
                    <h3 className="mt-1 text-lg font-semibold">{episode.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-950/62">{episode.topic}</p>
                  </div>
                  <Headphones className="h-5 w-5 shrink-0 text-indigo-600" />
                </div>
              </button>
            );
          })}
        </GlassCard>

        <GlassCard strong className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700/60">{selected.subject}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{selected.title}</h2>
              <p className="mt-3 leading-7 text-slate-950/66">{selected.description}</p>
            </div>
            <button
              type="button"
              onClick={toggleBookmark}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                bookmarked ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-200 bg-white/70 text-slate-950/70 hover:bg-white"
              }`}
            >
              <Bookmark className="mr-2 inline h-4 w-4" />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/68 p-5">
            <div className="mb-4 flex items-center gap-3 text-slate-950/70">
              <PlayCircle className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold">Now playing</span>
            </div>
            <audio controls preload="metadata" className="w-full" src={selected.src}>
              <track kind="captions" />
            </audio>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/62 p-5">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Listening notes</h3>
            </div>
            <textarea
              value={selectedNote}
              onChange={(event) => saveNote(event.target.value)}
              placeholder="Capture rules, traps, or questions to retry..."
              className="mt-4 min-h-44 w-full resize-y rounded-2xl border border-slate-200 bg-white/78 p-4 leading-7 outline-none focus:border-indigo-400"
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
