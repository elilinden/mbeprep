"use client";

import { FastForward, Headphones, NotebookPen, Pause, Play, Rewind, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { hydratePodcastStateFromCloud, savePodcastNoteToCloud } from "@/lib/cloudStudy";
import type { PodcastEpisode } from "@/lib/types";
import { readJsonStorage, scopedStorageKey, writeJsonStorage } from "@/lib/userStorage";

type PodcastNote = {
  episodeId: string;
  note: string;
  updatedAt: string;
};

const notesBaseKey = "mbe-prep-podcast-notes-v1";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function PodcastsClient({ episodes }: { episodes: PodcastEpisode[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedId, setSelectedId] = useState(episodes[0]?.id || "");
  const [notes, setNotes] = useState<Record<string, PodcastNote>>(() => readJsonStorage(scopedStorageKey(notesBaseKey), {}));
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    let active = true;
    const loadStoredAudioState = window.setTimeout(() => {
      const localNotes = readJsonStorage<Record<string, PodcastNote>>(scopedStorageKey(notesBaseKey), {});
      setNotes(localNotes);

      void hydratePodcastStateFromCloud(localNotes).then((cloudNotes) => {
        if (!active) {
          return;
        }

        setNotes(cloudNotes);
        writeJsonStorage(scopedStorageKey(notesBaseKey), cloudNotes);
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

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selected?.src]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

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

  function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play();
      return;
    }

    audio.pause();
  }

  function seekTo(value: number) {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = value;
    setCurrentTime(value);
  }

  function skipBy(seconds: number) {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration || audio.duration || 0);
    seekTo(nextTime);
  }

  function changeVolume(nextVolume: number) {
    const audio = audioRef.current;
    setVolume(nextVolume);

    if (audio) {
      audio.volume = nextVolume;
    }
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
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const progressStyle = {
    background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${progress}%, #CBD5E1 ${progress}%, #CBD5E1 100%)`
  };
  const volumeStyle = {
    background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${volume * 100}%, #CBD5E1 ${volume * 100}%, #CBD5E1 100%)`
  };

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
                    <h3 className="text-lg font-semibold">{episode.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-950/62">{episode.topic}</p>
                  </div>
                  <Headphones className="h-5 w-5 shrink-0 text-indigo-600" />
                </div>
              </button>
            );
          })}
        </GlassCard>

        <GlassCard strong className="space-y-5">
          <div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700/60">{selected.subject}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{selected.title}</h2>
              <p className="mt-3 leading-7 text-slate-950/66">{selected.description}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white/88 to-indigo-50/58 p-5 shadow-sm">
            <audio
              ref={audioRef}
              className="hidden"
              preload="metadata"
              src={selected.src}
              controlsList="nodownload noplaybackrate"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-slate-950/78">
                <span className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm shadow-indigo-600/20">
                  <Headphones className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-700/70">Now playing</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{selected.topic}</p>
                </div>
              </div>
              <p className="hidden rounded-full border border-slate-200 bg-white/76 px-3 py-1 text-sm font-semibold text-slate-950/62 sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-inner shadow-slate-200/60">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => skipBy(-15)}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  aria-label="Rewind 15 seconds"
                >
                  <Rewind className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="rounded-2xl bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => skipBy(15)}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  aria-label="Forward 15 seconds"
                >
                  <FastForward className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={Math.min(currentTime, duration || currentTime)}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    style={progressStyle}
                    className="audio-range h-2 w-full cursor-pointer rounded-full outline-none focus:ring-4 focus:ring-indigo-100"
                    aria-label="Podcast progress"
                  />
                  <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-slate-200/70 pt-4">
                <Volume2 className="h-4 w-4 text-slate-500" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  style={volumeStyle}
                  className="audio-range h-2 w-36 cursor-pointer rounded-full outline-none focus:ring-4 focus:ring-indigo-100"
                  aria-label="Podcast volume"
                />
                <span className="text-xs font-semibold text-slate-500">{Math.round(volume * 100)}%</span>
              </div>
            </div>
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
