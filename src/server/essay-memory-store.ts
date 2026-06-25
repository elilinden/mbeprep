import { demoEssays } from "@/domain/demo-admin-content";
import {
  assertSafeEssayWorkspace,
  autosaveEssayDraft,
  buildEssayReviewMaterial,
  calculateAccommodatedMinutes,
  createEssayMasteryArtifacts,
  createSafeEssayWorkspace,
  filterEssayLibrary,
  scoreEssaySelfAssessment,
  submitEssayAttempt,
} from "@/domain/essay-engine";
import type {
  EssayAttemptState,
  EssayLibraryFilters,
} from "@/domain/essay-types";
import { recordEssayMasteryArtifacts } from "@/server/mastery-memory-store";

type EssayStoreState = {
  attempts: Map<string, EssayAttemptState>;
  startKeys: Map<string, string>;
};

const globalForEssayStore = globalThis as typeof globalThis & {
  __mbeprepEssayStore?: EssayStoreState;
};

function getStore() {
  globalForEssayStore.__mbeprepEssayStore ??= {
    attempts: new Map(),
    startKeys: new Map(),
  };

  return globalForEssayStore.__mbeprepEssayStore;
}

export function listEssayLibraryForUser(input: {
  userId: string;
  filters?: EssayLibraryFilters;
}) {
  return filterEssayLibrary({
    essays: demoEssays,
    attempts: [...getStore().attempts.values()],
    userId: input.userId,
    filters: input.filters,
  });
}

export function listEssayMetadata() {
  const published = demoEssays.filter((essay) => essay.status === "PUBLISHED");

  return {
    examTracks: [...new Set(published.map((essay) => essay.examTrack))],
    subjects: [...new Set(published.map((essay) => essay.subject))],
    topics: [...new Set(published.map((essay) => essay.topic))],
    issues: [...new Set(published.map((essay) => essay.issue))],
    sourceYears: [...new Set(published.map((essay) => essay.sourceYear))],
    difficulties: [...new Set(published.map((essay) => essay.difficulty))],
  };
}

export function startEssayAttemptForUser(input: {
  userId: string;
  essayVersionId: string;
  extendedTimeMultiplier?: number | null;
  idempotencyKey?: string | null;
}) {
  const idempotencyKey = input.idempotencyKey?.trim();
  const startKey = idempotencyKey
    ? `${input.userId}:${input.essayVersionId}:${idempotencyKey}`
    : undefined;
  const existingAttemptId = startKey
    ? getStore().startKeys.get(startKey)
    : undefined;
  const existingAttempt = existingAttemptId
    ? getStore().attempts.get(existingAttemptId)
    : undefined;

  if (existingAttempt) {
    return existingAttempt;
  }

  const essay = requireEssay(input.essayVersionId);
  const timerMinutes = calculateAccommodatedMinutes({
    baseMinutes: essay.baseTimerMinutes,
    extendedTimeMultiplier: input.extendedTimeMultiplier,
  });
  const now = new Date();
  const attempt: EssayAttemptState = {
    id: `essay-attempt-${now.getTime()}-${Math.round(Math.random() * 1000)}`,
    userId: input.userId,
    essayVersionId: essay.id,
    status: "IN_PROGRESS",
    responseMode: essay.mode,
    timerMinutes,
    extendedTimeMultiplier: input.extendedTimeMultiplier ?? 1,
    outline: "",
    answer: "",
    wordCount: 0,
    startedAt: now,
    autosaves: [],
    notes: [],
    dataClassification: "DEMO_NOT_FOR_PUBLICATION",
  };

  getStore().attempts.set(attempt.id, attempt);
  if (startKey) {
    getStore().startKeys.set(startKey, attempt.id);
  }
  return attempt;
}

export function getEssayAttemptForUser(attemptId: string, userId: string) {
  const attempt = getStore().attempts.get(attemptId);

  if (!attempt || attempt.userId !== userId) {
    return null;
  }

  return attempt;
}

export function getSafeEssayWorkspaceForUser(input: {
  attemptId: string;
  userId: string;
}) {
  const attempt = getEssayAttemptForUser(input.attemptId, input.userId);

  if (!attempt) {
    return null;
  }

  const essay = requireEssay(attempt.essayVersionId);
  const workspace = createSafeEssayWorkspace({ essay, attempt });
  const violations = assertSafeEssayWorkspace(workspace);

  if (violations.length > 0) {
    throw new Error(`Unsafe essay workspace fields: ${violations.join(", ")}`);
  }

  return workspace;
}

export function autosaveEssayForUser(input: {
  attemptId: string;
  userId: string;
  outline: string;
  answer: string;
  clientSavedAt?: Date;
}) {
  const attempt = requireAttempt(input.attemptId, input.userId);

  return autosaveEssayDraft({
    attempt,
    outline: input.outline,
    answer: input.answer,
    clientSavedAt: input.clientSavedAt,
  });
}

export function submitEssayForUser(input: {
  attemptId: string;
  userId: string;
  outline: string;
  answer: string;
  idempotencyKey: string;
}) {
  const attempt = requireAttempt(input.attemptId, input.userId);

  return submitEssayAttempt({
    attempt,
    outline: input.outline,
    answer: input.answer,
    idempotencyKey: input.idempotencyKey,
  });
}

export function getEssayReviewForUser(attemptId: string, userId: string) {
  const attempt = getEssayAttemptForUser(attemptId, userId);

  if (!attempt) {
    return null;
  }

  const essay = requireEssay(attempt.essayVersionId);
  return buildEssayReviewMaterial({ essay, attempt });
}

export function submitEssaySelfAssessmentForUser(input: {
  attemptId: string;
  userId: string;
  missedRubricItemIds: string[];
  notes?: string;
}) {
  const attempt = requireAttempt(input.attemptId, input.userId);
  const essay = requireEssay(attempt.essayVersionId);
  const assessment = scoreEssaySelfAssessment({
    essay,
    attempt,
    missedRubricItemIds: input.missedRubricItemIds,
    notes: input.notes,
  });
  const artifacts = createEssayMasteryArtifacts({
    userId: input.userId,
    essay,
    attempt,
    assessment,
  });

  recordEssayMasteryArtifacts(artifacts);

  return { assessment, reviewItems: artifacts.reviewItems };
}

export function resetEssayMemoryStoreForTests() {
  globalForEssayStore.__mbeprepEssayStore = {
    attempts: new Map(),
    startKeys: new Map(),
  };
}

function requireAttempt(attemptId: string, userId: string) {
  const attempt = getEssayAttemptForUser(attemptId, userId);

  if (!attempt) {
    throw new Error("Essay attempt ownership validation failed.");
  }

  return attempt;
}

function requireEssay(essayVersionId: string) {
  const essay = demoEssays.find(
    (candidate) =>
      candidate.id === essayVersionId && candidate.status === "PUBLISHED",
  );

  if (!essay) {
    throw new Error("Essay fixture is unavailable.");
  }

  return essay;
}
