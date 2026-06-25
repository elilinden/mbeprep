import type { DemoEssayVersion } from "./admin-content-types";
import {
  ESSAY_SELF_ASSESSMENT_RELIABILITY_WEIGHT,
  type EssayAttemptState,
  type EssayAutosaveState,
  type EssayFeedbackProvider,
  type EssayFeedbackProviderJob,
  type EssayLibraryFilters,
  type EssayReviewMaterial,
  type EssaySelfAssessmentState,
  type SafeEssayLibraryItem,
  type SafeEssayWorkspace,
} from "./essay-types";
import type { MasteryEventInput, ReviewItemInput } from "./mastery-types";

export function filterEssayLibrary(input: {
  essays: readonly DemoEssayVersion[];
  attempts: readonly EssayAttemptState[];
  userId: string;
  filters?: EssayLibraryFilters;
}): SafeEssayLibraryItem[] {
  const filters = input.filters ?? {};

  return input.essays
    .filter((essay) => essay.status === "PUBLISHED")
    .filter(
      (essay) => !filters.examTrack || essay.examTrack === filters.examTrack,
    )
    .filter((essay) => !filters.subject || essay.subject === filters.subject)
    .filter((essay) => !filters.topic || essay.topic === filters.topic)
    .filter((essay) => !filters.issue || essay.issue === filters.issue)
    .filter(
      (essay) => !filters.sourceYear || essay.sourceYear === filters.sourceYear,
    )
    .filter(
      (essay) => !filters.difficulty || essay.difficulty === filters.difficulty,
    )
    .filter((essay) => {
      const completed = input.attempts.some(
        (attempt) =>
          attempt.userId === input.userId &&
          attempt.essayVersionId === essay.id &&
          ["SUBMITTED", "REVIEWED"].includes(attempt.status),
      );

      if (filters.completed && !completed) {
        return false;
      }

      if (filters.uncompleted && completed) {
        return false;
      }

      if (filters.fullAnswer && essay.mode !== "FULL_ANSWER") {
        return false;
      }

      if (filters.outlineOnly && essay.mode !== "OUTLINE_ONLY") {
        return false;
      }

      return true;
    })
    .map((essay) =>
      toSafeLibraryItem({
        essay,
        completed: input.attempts.some(
          (attempt) =>
            attempt.userId === input.userId &&
            attempt.essayVersionId === essay.id &&
            ["SUBMITTED", "REVIEWED"].includes(attempt.status),
        ),
      }),
    );
}

export function toSafeLibraryItem(input: {
  essay: DemoEssayVersion;
  completed: boolean;
}): SafeEssayLibraryItem {
  return {
    id: input.essay.id,
    title: input.essay.title,
    subject: input.essay.subject,
    topic: input.essay.topic,
    issue: input.essay.issue,
    sourceYear: input.essay.sourceYear,
    difficulty: input.essay.difficulty,
    examTrack: input.essay.examTrack,
    mode: input.essay.mode,
    baseTimerMinutes: input.essay.baseTimerMinutes,
    completed: input.completed,
    dataClassification: input.essay.dataClassification,
  };
}

export function createSafeEssayWorkspace(input: {
  essay: DemoEssayVersion;
  attempt: EssayAttemptState;
}): SafeEssayWorkspace {
  return {
    ...toSafeLibraryItem({
      essay: input.essay,
      completed: ["SUBMITTED", "REVIEWED"].includes(input.attempt.status),
    }),
    attemptId: input.attempt.id,
    prompt: input.essay.prompt,
    callsOfQuestion: input.essay.callsOfQuestion,
    timerMinutes: input.attempt.timerMinutes,
    extendedTimeMultiplier: input.attempt.extendedTimeMultiplier,
    outline: input.attempt.outline,
    answer: input.attempt.answer,
    wordCount: input.attempt.wordCount,
    autosavedAt: input.attempt.autosaves.at(-1)?.savedAt,
  };
}

export function assertSafeEssayWorkspace(workspace: SafeEssayWorkspace) {
  const serialized = JSON.stringify(workspace);
  const forbidden = [
    "sampleAnswer",
    "rubricItems",
    "issueChecklist",
    "maxPoints",
    "ruleStatement",
    "factApplicationGuidance",
    "commonMistakes",
  ];

  return forbidden.filter((term) => serialized.includes(term));
}

export function calculateAccommodatedMinutes(input: {
  baseMinutes: number;
  extendedTimeMultiplier?: number | null;
  minMultiplier?: number;
  maxMultiplier?: number;
}) {
  const min = input.minMultiplier ?? 1;
  const max = input.maxMultiplier ?? 3;
  const multiplier = input.extendedTimeMultiplier ?? 1;

  if (!Number.isFinite(multiplier) || multiplier < min || multiplier > max) {
    throw new Error(
      "Extended-time multiplier is outside the configured range.",
    );
  }

  return Math.ceil(input.baseMinutes * multiplier);
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function autosaveEssayDraft(input: {
  attempt: EssayAttemptState;
  outline: string;
  answer: string;
  clientSavedAt?: Date;
  savedAt?: Date;
}) {
  ensureEditableAttempt(input.attempt);
  const savedAt = input.savedAt ?? new Date();
  const autosave: EssayAutosaveState = {
    id: `essay-autosave-${savedAt.getTime()}-${input.attempt.autosaves.length}`,
    essayAttemptId: input.attempt.id,
    outline: input.outline,
    answer: input.answer,
    wordCount: countWords(input.answer),
    clientSavedAt: input.clientSavedAt,
    savedAt,
  };

  input.attempt.outline = input.outline;
  input.attempt.answer = input.answer;
  input.attempt.wordCount = autosave.wordCount;
  input.attempt.autosaves.push(autosave);

  return autosave;
}

export function chooseRecoveredEssayDraft(input: {
  server?: { outline: string; answer: string; savedAt: Date };
  local?: { outline: string; answer: string; savedAt: Date };
}) {
  if (!input.server) {
    return input.local;
  }

  if (!input.local) {
    return input.server;
  }

  return input.local.savedAt.getTime() > input.server.savedAt.getTime()
    ? input.local
    : input.server;
}

export function submitEssayAttempt(input: {
  attempt: EssayAttemptState;
  outline: string;
  answer: string;
  idempotencyKey: string;
  submittedAt?: Date;
}) {
  if (
    input.attempt.status === "SUBMITTED" ||
    input.attempt.status === "REVIEWED"
  ) {
    return {
      attempt: input.attempt,
      duplicate: input.attempt.idempotencyKey === input.idempotencyKey,
    };
  }

  ensureEditableAttempt(input.attempt);

  if (!input.idempotencyKey.trim()) {
    throw new Error("Essay submission requires an idempotency key.");
  }

  input.attempt.outline = input.outline;
  input.attempt.answer = input.answer;
  input.attempt.wordCount = countWords(input.answer);
  input.attempt.status = "SUBMITTED";
  input.attempt.submittedAt = input.submittedAt ?? new Date();
  input.attempt.idempotencyKey = input.idempotencyKey;

  return { attempt: input.attempt, duplicate: false };
}

export function buildEssayReviewMaterial(input: {
  essay: DemoEssayVersion;
  attempt: EssayAttemptState;
}): EssayReviewMaterial {
  if (
    input.attempt.status !== "SUBMITTED" &&
    input.attempt.status !== "REVIEWED"
  ) {
    throw new Error(
      "Essay review material is available only after submission.",
    );
  }

  return {
    ...createSafeEssayWorkspace(input),
    studentAnswer: input.attempt.answer,
    sampleAnswer: input.essay.sampleAnswer,
    issueChecklist: input.essay.rubricItems.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      maxPoints: item.maxPoints,
      topic: item.topic,
      ruleStatement: item.ruleStatement,
      factApplicationGuidance: item.factApplicationGuidance,
      commonMistakes: item.commonMistakes,
    })),
    assessment: input.attempt.assessment,
  };
}

export function scoreEssaySelfAssessment(input: {
  essay: DemoEssayVersion;
  attempt: EssayAttemptState;
  missedRubricItemIds: readonly string[];
  notes?: string;
  submittedAt?: Date;
}) {
  if (
    input.attempt.status !== "SUBMITTED" &&
    input.attempt.status !== "REVIEWED"
  ) {
    throw new Error("Self-assessment requires a submitted essay attempt.");
  }

  const missed = new Set(input.missedRubricItemIds);
  const totalPoints = input.essay.rubricItems.reduce(
    (sum, item) => sum + item.maxPoints,
    0,
  );
  const items = input.essay.rubricItems.map((item) => ({
    rubricItemId: item.id,
    missed: missed.has(item.id),
    awardedPoints: missed.has(item.id) ? 0 : item.maxPoints,
  }));
  const earnedPoints = items.reduce((sum, item) => sum + item.awardedPoints, 0);
  const submittedAt = input.submittedAt ?? new Date();
  const assessment: EssaySelfAssessmentState = {
    id: `essay-assessment-${input.attempt.id}`,
    essayAttemptId: input.attempt.id,
    essayVersionId: input.essay.id,
    rubricVersion: input.essay.version,
    totalPoints,
    earnedPoints,
    reliabilityWeight: ESSAY_SELF_ASSESSMENT_RELIABILITY_WEIGHT,
    notes: input.notes,
    submittedAt,
    items,
  };

  input.attempt.status = "REVIEWED";
  input.attempt.reviewedAt = submittedAt;
  input.attempt.assessment = assessment;

  return assessment;
}

export function createEssayMasteryArtifacts(input: {
  userId: string;
  essay: DemoEssayVersion;
  attempt: EssayAttemptState;
  assessment: EssaySelfAssessmentState;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt ?? input.assessment.submittedAt;
  const missed = new Set(
    input.assessment.items
      .filter((item) => item.missed)
      .map((item) => item.rubricItemId),
  );
  const events: MasteryEventInput[] = input.essay.rubricItems.map((item) => ({
    id: `essay-mastery-${input.attempt.id}-${item.id}`,
    userId: input.userId,
    taxonomyNodeId: item.taxonomyNodeId,
    topicLabel: item.topic,
    subject: input.essay.subject,
    category: item.topic,
    questionKey: `${input.essay.id}:${item.id}`,
    ruleKey: item.taxonomyNodeId,
    essayAttemptId: input.attempt.id,
    essayRubricItemId: item.id,
    eventWeight: input.assessment.reliabilityWeight,
    isCorrect: !missed.has(item.id),
    confidence: "MEDIUM",
    occurredAt,
    studentAnswer: input.attempt.answer,
    correctAnswer: item.description,
    criticalFact: item.label,
    errorReason: missed.has(item.id)
      ? "Essay rubric item missed."
      : "Essay rubric item self-assessed as present.",
    relatedPodcast: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
  }));
  const reviewItems: ReviewItemInput[] = input.essay.rubricItems
    .filter((item) => missed.has(item.id))
    .map((item) => ({
      id: `review-essay-${input.attempt.id}-${item.id}`,
      userId: input.userId,
      taxonomyNodeId: item.taxonomyNodeId,
      topic: item.topic,
      rule: item.taxonomyNodeId,
      source: "ESSAY_RUBRIC_MISS",
      essayAttemptId: input.attempt.id,
      essayRubricItemId: item.id,
      criticalFact: item.label,
      studentAnswer: input.attempt.answer,
      correctAnswer: item.description,
      errorReason: "Essay rubric item missed.",
      relatedPodcast: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
      dueAt: addDays(occurredAt, 1),
      status: "OPEN",
      history: [],
    }));

  return { events, reviewItems };
}

export const disabledEssayFeedbackProvider: EssayFeedbackProvider = {
  key: "disabled",
  async requestFeedback(input): Promise<EssayFeedbackProviderJob> {
    return {
      id: `essay-feedback-disabled-${input.attempt.id}`,
      attemptId: input.attempt.id,
      providerKey: "disabled",
      status: "DISABLED",
      requestMetadata: {
        essayVersionId: input.essay.id,
        dataClassification: input.essay.dataClassification,
      },
    };
  },
};

function ensureEditableAttempt(attempt: EssayAttemptState) {
  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("Essay attempt is not editable.");
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}
