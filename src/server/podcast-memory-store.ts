import type {
  DemoEssayVersion,
  DemoQuestionVersion,
} from "@/domain/admin-content-types";
import type { AudioProcessingState } from "@/domain/podcast-types";
import type { PodcastLibraryEpisode } from "@/domain/podcast-library";
import { demoPodcastLibrary } from "@/domain/demo-podcasts";
import {
  createBookmark,
  createPodcastNote,
  updatePodcastProgress,
} from "@/domain/podcast-progress";

export type StoredPodcastEpisode = PodcastLibraryEpisode & {
  processingState: AudioProcessingState;
  processingError: string | null;
  reviewed: boolean;
  audioMimeType: string;
  audioSizeBytes: number;
};

type StoreState = {
  episodes: StoredPodcastEpisode[];
  progress: Map<
    string,
    {
      positionSeconds: number;
      segments: Array<{ startSeconds: number; endSeconds: number }>;
      completed: boolean;
    }
  >;
  bookmarks: Array<ReturnType<typeof createBookmark>>;
  notes: Array<ReturnType<typeof createPodcastNote>>;
};

const globalForPodcastStore = globalThis as typeof globalThis & {
  __mbeprepPodcastStore?: StoreState;
};

function getStore() {
  globalForPodcastStore.__mbeprepPodcastStore ??= {
    episodes: demoPodcastLibrary.map((episode) => ({
      ...episode,
      processingState: "PUBLISHED",
      processingError: null,
      reviewed: true,
      audioMimeType: "audio/mpeg",
      audioSizeBytes: 1024,
    })),
    progress: new Map(),
    bookmarks: [],
    notes: [],
  };

  return globalForPodcastStore.__mbeprepPodcastStore;
}

export function listPodcastEpisodes() {
  return [...getStore().episodes];
}

export function listPublishedPodcastEpisodes() {
  return listPodcastEpisodes().filter(
    (episode) =>
      episode.status === "PUBLISHED" && episode.processingState === "PUBLISHED",
  );
}

export function findPodcastEpisode(episodeId: string) {
  return (
    listPodcastEpisodes().find((episode) => episode.id === episodeId) ?? null
  );
}

export function addUploadedPodcastEpisode(input: {
  title: string;
  summary: string;
  instructor: string;
  learningObjectives: string[];
  subject: string;
  topics: string[];
  transcriptText: string;
  transcriptSegmentsInput?: string;
  chaptersInput?: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const id = `podcast-${Date.now()}`;
  const transcriptSegments =
    parseTranscriptSegments(input.transcriptSegmentsInput ?? "", id) ??
    splitTranscript(input.transcriptText, id);
  const episode: StoredPodcastEpisode = {
    id,
    key: id,
    title: labelDemo(input.title),
    description: labelDemo(input.summary),
    transcriptText: labelDemo(input.transcriptText),
    transcriptUri: null,
    audioUri: null,
    status: "DRAFT",
    dataClassification: "DEMO_NOT_FOR_PUBLICATION",
    effectiveFrom: "2026-06-24",
    effectiveTo: null,
    lastReviewedAt: null,
    sourceKey: "demo-source",
    licenseKey: "demo-internal-license",
    subject: input.subject,
    topics: input.topics,
    summary: labelDemo(input.summary),
    instructor: input.instructor || "Development Instructor",
    learningObjectives: input.learningObjectives.map(labelDemo),
    transcriptSegments,
    chapters: parseChapters(input.chaptersInput ?? "", id),
    relatedQuestions: [] satisfies DemoQuestionVersion[],
    relatedEssays: [] satisfies DemoEssayVersion[],
    durationSeconds: 120,
    audioObjectKey: input.objectKey,
    processingState: "READY_FOR_REVIEW",
    processingError: null,
    reviewed: false,
    audioMimeType: input.mimeType,
    audioSizeBytes: input.sizeBytes,
  };

  getStore().episodes.unshift(episode);
  return episode;
}

export function markPodcastReviewed(episodeId: string) {
  const episode = getStore().episodes.find((item) => item.id === episodeId);
  if (!episode) {
    throw new Error("Podcast episode not found.");
  }

  episode.reviewed = true;
  episode.processingState = "READY_FOR_REVIEW";
  episode.lastReviewedAt = "2026-06-24";
  return episode;
}

export function publishPodcastEpisode(episodeId: string) {
  const episode = getStore().episodes.find((item) => item.id === episodeId);
  if (!episode) {
    throw new Error("Podcast episode not found.");
  }

  episode.status = "PUBLISHED";
  episode.processingState = "PUBLISHED";
  return episode;
}

export function savePodcastProgress(input: {
  userId: string;
  episodeId: string;
  positionSeconds: number;
  previousPositionSeconds?: number;
}) {
  const episode = findPodcastEpisode(input.episodeId);
  if (!episode) {
    throw new Error("Podcast episode not found.");
  }

  const key = progressKey(input.userId, input.episodeId);
  const current = getStore().progress.get(key) ?? {
    positionSeconds: 0,
    segments: [],
    completed: false,
  };
  const previousPosition =
    input.previousPositionSeconds ?? current.positionSeconds;
  const next = updatePodcastProgress(current, {
    positionSeconds: input.positionSeconds,
    listenedSegment: {
      startSeconds: Math.min(previousPosition, input.positionSeconds),
      endSeconds: Math.max(previousPosition, input.positionSeconds),
    },
    durationSeconds: episode.durationSeconds,
  });

  getStore().progress.set(key, next);
  return next;
}

export function getPodcastProgress(userId: string, episodeId: string) {
  return (
    getStore().progress.get(progressKey(userId, episodeId)) ?? {
      positionSeconds: 0,
      segments: [],
      completed: false,
    }
  );
}

export function addPodcastBookmark(input: {
  userId: string;
  episodeId: string;
  timestampSeconds: number;
  label?: string | null;
}) {
  const bookmark = createBookmark(input);
  getStore().bookmarks.push(bookmark);
  return bookmark;
}

export function addPodcastNote(input: {
  userId: string;
  episodeId: string;
  timestampSeconds: number;
  body: string;
}) {
  const note = createPodcastNote(input);
  getStore().notes.push(note);
  return note;
}

export function getPodcastBookmarks(userId: string, episodeId: string) {
  return getStore().bookmarks.filter(
    (bookmark) =>
      bookmark.userId === userId && bookmark.episodeId === episodeId,
  );
}

export function getPodcastNotes(userId: string, episodeId: string) {
  return getStore().notes.filter(
    (note) => note.userId === userId && note.episodeId === episodeId,
  );
}

function progressKey(userId: string, episodeId: string) {
  return `${userId}:${episodeId}`;
}

function labelDemo(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "DEMO_NOT_FOR_PUBLICATION";
  }

  return trimmed.includes("DEMO_NOT_FOR_PUBLICATION")
    ? trimmed
    : `DEMO_NOT_FOR_PUBLICATION ${trimmed}`;
}

function splitTranscript(transcriptText: string, episodeId: string) {
  const parts = transcriptText
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const source =
    parts.length > 0 ? parts : ["DEMO_NOT_FOR_PUBLICATION transcript pending."];

  return source.map((text, index) => ({
    id: `${episodeId}-segment-${index + 1}`,
    startSeconds: index * 30,
    endSeconds: (index + 1) * 30,
    text: labelDemo(text),
  }));
}

function parseTranscriptSegments(value: string, episodeId: string) {
  const segments = value
    .split("\n")
    .map((line, index) => {
      const [start, end, ...textParts] = line.split("|");
      const startSeconds = Number(start);
      const endSeconds = Number(end);
      const text = textParts.join("|").trim();

      if (
        !Number.isFinite(startSeconds) ||
        !Number.isFinite(endSeconds) ||
        !text
      ) {
        return null;
      }

      return {
        id: `${episodeId}-segment-${index + 1}`,
        startSeconds,
        endSeconds,
        text: labelDemo(text),
      };
    })
    .filter((segment) => segment !== null);

  return segments.length > 0 ? segments : null;
}

function parseChapters(value: string, episodeId: string) {
  const chapters = value
    .split("\n")
    .map((line, index) => {
      const [start, ...titleParts] = line.split("|");
      const startSeconds = Number(start);
      const title = titleParts.join("|").trim();

      if (!Number.isFinite(startSeconds) || !title) {
        return null;
      }

      return {
        id: `${episodeId}-chapter-${index + 1}`,
        title,
        startSeconds,
      };
    })
    .filter((chapter) => chapter !== null);

  return chapters.length > 0
    ? chapters
    : [
        {
          id: `${episodeId}-chapter-1`,
          title: "Uploaded audio",
          startSeconds: 0,
        },
      ];
}
