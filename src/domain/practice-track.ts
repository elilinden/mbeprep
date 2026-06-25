import type { ExamTrackCode } from "./exam-track";

export type LearnerPracticeTrackResolution = {
  examTrack: ExamTrackCode;
  normalizedFrom?: ExamTrackCode;
};

const supportedPracticeTracks = [
  "LEGACY_UBE",
  "NEXTGEN_UBE",
  "STATE_SPECIFIC",
] as const satisfies readonly ExamTrackCode[];

export function resolveLearnerPracticeExamTrack(input: {
  learnerExamTrack?: ExamTrackCode | null;
  requestedExamTrack?: string | null;
}): LearnerPracticeTrackResolution {
  if (!input.learnerExamTrack) {
    throw new Error("Complete onboarding before starting practice.");
  }

  const requested = normalizeExamTrack(input.requestedExamTrack);

  if (!requested || requested === input.learnerExamTrack) {
    return { examTrack: input.learnerExamTrack };
  }

  return {
    examTrack: input.learnerExamTrack,
    normalizedFrom: requested,
  };
}

export function normalizeExamTrack(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (supportedPracticeTracks.includes(normalized as ExamTrackCode)) {
    return normalized as ExamTrackCode;
  }

  throw new Error("Requested exam track is not supported.");
}

export function formatExamTrackLabel(track: ExamTrackCode) {
  const labels = {
    LEGACY_UBE: "Legacy UBE",
    NEXTGEN_UBE: "NextGen UBE",
    STATE_SPECIFIC: "State-specific",
  } satisfies Record<ExamTrackCode, string>;

  return labels[track];
}
