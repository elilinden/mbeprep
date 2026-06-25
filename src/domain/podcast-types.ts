export const AUDIO_PROCESSING_STATES = [
  "UPLOADED",
  "PROCESSING",
  "READY_FOR_REVIEW",
  "PUBLISHED",
  "FAILED",
  "RETIRED",
] as const;

export type AudioProcessingState = (typeof AUDIO_PROCESSING_STATES)[number];

export type AudioMimeType = "audio/mpeg" | "audio/mp4" | "audio/x-m4a";

export type AudioFileCandidate = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type TranscriptSegment = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type PodcastChapter = {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds?: number | null;
};

export type ListeningSegment = {
  startSeconds: number;
  endSeconds: number;
};

export type PodcastProgressState = {
  positionSeconds: number;
  segments: ListeningSegment[];
  completed: boolean;
};

export type PodcastBookmarkRecord = {
  id: string;
  userId: string;
  episodeId: string;
  timestampSeconds: number;
  label?: string | null;
};

export type PodcastNoteRecord = {
  id: string;
  userId: string;
  episodeId: string;
  timestampSeconds: number;
  body: string;
};
