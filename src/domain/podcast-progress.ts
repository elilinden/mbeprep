import type {
  ListeningSegment,
  PodcastBookmarkRecord,
  PodcastNoteRecord,
  PodcastProgressState,
} from "./podcast-types";

export function mergeListenedSegments(
  existing: readonly ListeningSegment[],
  next: ListeningSegment,
) {
  const normalized = [...existing, normalizeSegment(next)]
    .filter((segment) => segment.endSeconds > segment.startSeconds)
    .sort((a, b) => a.startSeconds - b.startSeconds);
  const merged: ListeningSegment[] = [];

  for (const segment of normalized) {
    const previous = merged.at(-1);

    if (!previous || segment.startSeconds > previous.endSeconds) {
      merged.push({ ...segment });
      continue;
    }

    previous.endSeconds = Math.max(previous.endSeconds, segment.endSeconds);
  }

  return merged;
}

export function updatePodcastProgress(
  state: PodcastProgressState,
  update: {
    positionSeconds: number;
    listenedSegment?: ListeningSegment;
    durationSeconds?: number;
  },
) {
  const segments = update.listenedSegment
    ? mergeListenedSegments(state.segments, update.listenedSegment)
    : state.segments;
  const completed =
    update.durationSeconds != null &&
    getUniqueListenedSeconds(segments) >= update.durationSeconds * 0.9;

  return {
    positionSeconds: Math.max(0, Math.floor(update.positionSeconds)),
    segments,
    completed,
  };
}

export function shouldPersistProgress(
  lastPersistedAtMs: number,
  nowMs: number,
  intervalMs = 15_000,
) {
  return nowMs - lastPersistedAtMs >= intervalMs;
}

export function getResumePosition(
  state: Pick<PodcastProgressState, "positionSeconds">,
) {
  return Math.max(0, state.positionSeconds);
}

export function getUniqueListenedSeconds(
  segments: readonly ListeningSegment[],
) {
  return segments.reduce(
    (total, segment) =>
      total + Math.max(0, segment.endSeconds - segment.startSeconds),
    0,
  );
}

export function createBookmark(input: Omit<PodcastBookmarkRecord, "id">) {
  return {
    id: `bookmark-${input.userId}-${input.episodeId}-${input.timestampSeconds}`,
    ...input,
  };
}

export function createPodcastNote(input: Omit<PodcastNoteRecord, "id">) {
  if (!input.body.trim()) {
    throw new Error("Podcast note body is required.");
  }

  return {
    id: `note-${input.userId}-${input.episodeId}-${input.timestampSeconds}`,
    ...input,
  };
}

function normalizeSegment(segment: ListeningSegment) {
  return {
    startSeconds: Math.max(0, Math.floor(segment.startSeconds)),
    endSeconds: Math.max(0, Math.floor(segment.endSeconds)),
  };
}
