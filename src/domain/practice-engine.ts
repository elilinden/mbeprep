import type { DemoQuestionVersion } from "./admin-content-types";
import {
  ATTEMPT_CONFIDENCE,
  MISTAKE_TAGS,
  PRACTICE_FEEDBACK_MODES,
  PRACTICE_SESSION_MODES,
  PRACTICE_TIMING_MODES,
  type AttemptConfidence,
  type MistakeTag,
  type PracticeAttempt,
  type PracticeBuilderFilters,
  type PracticeReviewSummary,
  type PracticeSessionState,
  type QuestionExplanation,
  type SafePracticeQuestion,
} from "./practice-types";

export function normalizePracticeFilters(
  input: Partial<PracticeBuilderFilters>,
): PracticeBuilderFilters {
  const mode = normalizeEnum(input.mode, PRACTICE_SESSION_MODES, "LEARNING");
  const feedbackMode =
    mode === "LEARNING"
      ? "IMMEDIATE"
      : normalizeEnum(
          input.feedbackMode,
          PRACTICE_FEEDBACK_MODES,
          "END_OF_SET",
        );

  return {
    mode,
    examTrack: input.examTrack,
    subject: blankToUndefined(input.subject),
    category: blankToUndefined(input.category),
    subtopic: blankToUndefined(input.subtopic),
    questionCount: clampQuestionCount(input.questionCount ?? 1),
    difficulty: input.difficulty,
    unseen: Boolean(input.unseen),
    incorrect: Boolean(input.incorrect),
    bookmarked: Boolean(input.bookmarked),
    timingMode: normalizeEnum(
      input.timingMode,
      PRACTICE_TIMING_MODES,
      "UNTIMED",
    ),
    feedbackMode,
    topicPriority: input.topicPriority?.filter(Boolean) ?? [],
  };
}

export function selectPracticeQuestions(input: {
  questions: readonly DemoQuestionVersion[];
  filters: PracticeBuilderFilters;
  previouslyAttemptedQuestionIds?: readonly string[];
  incorrectQuestionIds?: readonly string[];
  bookmarkedQuestionIds?: readonly string[];
}) {
  const attempted = new Set(input.previouslyAttemptedQuestionIds ?? []);
  const incorrect = new Set(input.incorrectQuestionIds ?? []);
  const bookmarked = new Set(input.bookmarkedQuestionIds ?? []);
  const priority = input.filters.topicPriority ?? [];

  const filtered = input.questions
    .filter((question) => question.status === "PUBLISHED")
    .filter(
      (question) => question.dataClassification === "DEMO_NOT_FOR_PUBLICATION",
    )
    .filter(
      (question) =>
        !input.filters.examTrack ||
        question.examTrack === input.filters.examTrack,
    )
    .filter(
      (question) =>
        !input.filters.subject || question.subject === input.filters.subject,
    )
    .filter(
      (question) =>
        !input.filters.category || question.category === input.filters.category,
    )
    .filter(
      (question) =>
        !input.filters.difficulty ||
        question.difficulty === input.filters.difficulty,
    )
    .filter((question) => !input.filters.unseen || !attempted.has(question.id))
    .filter(
      (question) => !input.filters.incorrect || incorrect.has(question.id),
    )
    .filter(
      (question) => !input.filters.bookmarked || bookmarked.has(question.id),
    )
    .sort((left, right) => {
      if (input.filters.mode !== "ADAPTIVE") {
        return left.id.localeCompare(right.id);
      }

      return priorityScore(right, priority) - priorityScore(left, priority);
    });

  return filtered.slice(0, input.filters.questionCount);
}

export function createPracticeSession(input: {
  id: string;
  userId: string;
  filters: PracticeBuilderFilters;
  questions: readonly DemoQuestionVersion[];
  seed: string;
  startedAt?: Date;
}): PracticeSessionState {
  return {
    id: input.id,
    userId: input.userId,
    mode: input.filters.mode,
    status: "IN_PROGRESS",
    feedbackMode: input.filters.feedbackMode,
    timingMode: input.filters.timingMode,
    filters: input.filters,
    currentQuestionIndex: 0,
    startedAt: input.startedAt ?? new Date(),
    completedAt: null,
    questions: input.questions.map((question, index) => ({
      id: `${input.id}-sq-${index + 1}`,
      question,
      position: index,
      choiceOrder: stableChoiceOrder(question, `${input.seed}-${question.id}`),
      flagged: false,
      struckChoiceIds: [],
    })),
    attempts: [],
    bookmarks: new Set(),
    notes: [],
  };
}

export function getSafePracticeQuestion(
  session: PracticeSessionState,
  position = session.currentQuestionIndex,
): SafePracticeQuestion {
  const sessionQuestion = session.questions[position];

  if (!sessionQuestion) {
    throw new Error("Session question not found.");
  }

  return {
    sessionQuestionId: sessionQuestion.id,
    questionVersionId: sessionQuestion.question.id,
    examTrack: sessionQuestion.question.examTrack,
    format: sessionQuestion.question.format,
    position: sessionQuestion.position,
    totalQuestions: session.questions.length,
    mode: session.mode,
    feedbackMode: session.feedbackMode,
    timingMode: session.timingMode,
    status: session.status,
    subject: sessionQuestion.question.subject,
    category: sessionQuestion.question.category,
    difficulty: sessionQuestion.question.difficulty,
    estimatedSeconds: sessionQuestion.question.estimatedSeconds,
    setLevelTimingSeconds: sessionQuestion.question.setLevelTimingSeconds,
    stem: sessionQuestion.question.stem,
    callOfQuestion: sessionQuestion.question.callOfQuestion,
    integratedSetId: sessionQuestion.question.integratedSetId,
    commonFactScenario: sessionQuestion.question.commonFactScenario,
    attachedResources: sessionQuestion.question.attachedResources ?? [],
    exhibits: sessionQuestion.question.exhibits ?? [],
    performanceTaskLibrary:
      sessionQuestion.question.performanceTaskLibrary ?? [],
    responseAreas: sessionQuestion.question.responseAreas ?? [],
    choices: sessionQuestion.choiceOrder.map((choiceId) => {
      const choice = requireChoice(sessionQuestion.question, choiceId);
      return {
        id: choice.label,
        label: choice.label,
        text: choice.text,
        struck: sessionQuestion.struckChoiceIds.includes(choice.label),
      };
    }),
    flagged: sessionQuestion.flagged,
  };
}

export function assertSafeInitialPayload(payload: unknown) {
  const serialized = JSON.stringify(payload);
  const forbidden = [
    "isCorrect",
    "correctChoiceIds",
    "correctAnswer",
    "rationale",
    "explanation",
    "distractorType",
    "scoringRubric",
    "acceptedResponseMarkers",
    "governingRule",
    "application",
    "commonTrap",
    "memoryAid",
    "authorityNotes",
    "reviewerComments",
    "reviewChecklist",
    "importMetadata",
  ];

  return forbidden.filter((token) => serialized.includes(token));
}

export function submitPracticeAnswer(input: {
  session: PracticeSessionState;
  userId: string;
  sessionQuestionId: string;
  selectedChoiceIds: readonly string[];
  writtenResponses?: Record<string, string>;
  responseTimeMs: number;
  confidence?: AttemptConfidence;
  answerChanges: number;
  idempotencyKey: string;
}) {
  if (input.session.userId !== input.userId) {
    throw new Error("Practice session ownership validation failed.");
  }

  const duplicate = input.session.attempts.find(
    (attempt) => attempt.idempotencyKey === input.idempotencyKey,
  );

  if (duplicate) {
    return { attempt: { ...duplicate, duplicate: true }, duplicate: true };
  }

  if (input.session.status !== "IN_PROGRESS") {
    throw new Error("Practice session is not accepting submissions.");
  }

  const sessionQuestion = input.session.questions.find(
    (question) => question.id === input.sessionQuestionId,
  );

  if (!sessionQuestion) {
    throw new Error("Session question not found.");
  }

  const existingQuestionAttempt = input.session.attempts.find(
    (attempt) => attempt.sessionQuestionId === input.sessionQuestionId,
  );

  if (existingQuestionAttempt) {
    throw new Error("Session question has already been submitted.");
  }

  if (input.confidence && !ATTEMPT_CONFIDENCE.includes(input.confidence)) {
    throw new Error("Attempt confidence is invalid.");
  }

  const selectedChoiceIds = [...new Set(input.selectedChoiceIds)];
  const validChoiceIds = new Set(
    sessionQuestion.question.choices.map((choice) => choice.label),
  );

  if (sessionQuestion.question.choices.length > 0) {
    if (
      selectedChoiceIds.length === 0 ||
      selectedChoiceIds.some((choiceId) => !validChoiceIds.has(choiceId))
    ) {
      throw new Error(
        "Selected choices are invalid for this session question.",
      );
    }
  }

  if (
    sessionQuestion.question.format === "SELECT_TWO" &&
    selectedChoiceIds.length !== 2
  ) {
    throw new Error("Select-two questions require exactly two choices.");
  }

  if (
    isWrittenQuestion(sessionQuestion.question) &&
    Object.keys(input.writtenResponses ?? {}).length === 0
  ) {
    throw new Error("Written response is required for this question.");
  }

  const score = scoreQuestionResponse({
    question: sessionQuestion.question,
    selectedChoiceIds,
    writtenResponses: input.writtenResponses ?? {},
  });
  const attempt: PracticeAttempt = {
    id: `${input.sessionQuestionId}-attempt`,
    sessionQuestionId: input.sessionQuestionId,
    questionVersionId: sessionQuestion.question.id,
    selectedChoiceIds,
    responseTimeMs: Math.max(0, Math.floor(input.responseTimeMs)),
    confidence: input.confidence,
    answerChanges: Math.max(0, Math.floor(input.answerChanges)),
    isCorrect: score.earnedPoints >= score.maxPoints,
    earnedPoints: score.earnedPoints,
    maxPoints: score.maxPoints,
    scoreScale: score.scoreScale,
    writtenResponses: input.writtenResponses ?? {},
    submittedAt: new Date(),
    idempotencyKey: input.idempotencyKey,
    duplicate: false,
    mistakeTags: [],
  };

  input.session.attempts.push(attempt);
  input.session.currentQuestionIndex = Math.min(
    input.session.questions.length - 1,
    sessionQuestion.position + 1,
  );

  if (input.session.attempts.length === input.session.questions.length) {
    input.session.status = "COMPLETED";
    input.session.completedAt = new Date();
  }

  return { attempt, duplicate: false };
}

export function canRevealExplanation(input: {
  session: PracticeSessionState;
  sessionQuestionId: string;
}) {
  const hasAttempt = input.session.attempts.some(
    (attempt) => attempt.sessionQuestionId === input.sessionQuestionId,
  );

  if (!hasAttempt) {
    return false;
  }

  return (
    input.session.feedbackMode === "IMMEDIATE" ||
    input.session.status === "COMPLETED"
  );
}

export function buildQuestionExplanation(
  question: DemoQuestionVersion,
): QuestionExplanation {
  const correctChoiceIds = getCorrectChoiceIds(question);

  return {
    correctChoiceIds,
    correctAnswer:
      correctChoiceIds.length > 0
        ? correctChoiceIds.join(", ")
        : "DEMO_NOT_FOR_PUBLICATION rubric-guided response.",
    maxPoints: question.scoringRubric?.maxPoints,
    rubricVersion: question.scoringRubric?.version,
    testedIssue:
      question.testedIssue ?? `${question.subject}: ${question.category}`,
    governingRule:
      question.governingRule ??
      "DEMO_NOT_FOR_PUBLICATION governing rule placeholder.",
    application:
      question.application ??
      "DEMO_NOT_FOR_PUBLICATION application placeholder.",
    choices: question.choices.map((choice) => ({
      id: choice.label,
      label: choice.label,
      text: choice.text,
      isCorrect: choice.isCorrect,
      rationale: choice.rationale,
      distractorType: choice.distractorType,
    })),
    relatedPodcastTimestamp: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
    relatedRuleIds: ["DEMO_NOT_FOR_PUBLICATION-rule"],
    relatedQuestionIds: question.secondaryTopics,
  };
}

export function buildPracticeReviewSummary(
  session: PracticeSessionState,
): PracticeReviewSummary {
  const total = session.questions.reduce(
    (sum, sessionQuestion) =>
      sum + getQuestionMaxPoints(sessionQuestion.question),
    0,
  );
  const correct = session.attempts.reduce(
    (sum, attempt) => sum + attempt.earnedPoints,
    0,
  );
  const byTopic = new Map<string, { correct: number; total: number }>();

  for (const sessionQuestion of session.questions) {
    const attempt = session.attempts.find(
      (item) => item.sessionQuestionId === sessionQuestion.id,
    );
    const topic = `${sessionQuestion.question.subject}: ${sessionQuestion.question.category}`;
    const current = byTopic.get(topic) ?? { correct: 0, total: 0 };
    current.total += getQuestionMaxPoints(sessionQuestion.question);
    current.correct += attempt?.earnedPoints ?? 0;
    byTopic.set(topic, current);
  }

  return {
    score: Number(correct.toFixed(2)),
    total,
    accuracy: total === 0 ? 0 : correct / total,
    averageTimeMs:
      session.attempts.length === 0
        ? 0
        : Math.round(
            session.attempts.reduce(
              (sum, attempt) => sum + attempt.responseTimeMs,
              0,
            ) / session.attempts.length,
          ),
    byTopic: [...byTopic.entries()].map(([topic, value]) => ({
      topic,
      ...value,
    })),
    highConfidenceErrors: session.attempts.filter(
      (attempt) => attempt.confidence === "HIGH" && !attempt.isCorrect,
    ),
    changedAnswerCount: session.attempts.filter(
      (attempt) => attempt.answerChanges > 0,
    ).length,
    incorrectAttempts: session.attempts.filter((attempt) => !attempt.isCorrect),
  };
}

export function addMistakeTag(attempt: PracticeAttempt, tag: MistakeTag) {
  if (!MISTAKE_TAGS.includes(tag)) {
    throw new Error("Mistake tag is invalid.");
  }

  if (!attempt.mistakeTags.includes(tag)) {
    attempt.mistakeTags.push(tag);
  }
}

export function flagSessionQuestion(
  session: PracticeSessionState,
  sessionQuestionId: string,
  flagged: boolean,
) {
  const sessionQuestion = session.questions.find(
    (question) => question.id === sessionQuestionId,
  );

  if (!sessionQuestion) {
    throw new Error("Session question not found.");
  }

  sessionQuestion.flagged = flagged;
}

export function toggleStrikeChoice(
  session: PracticeSessionState,
  sessionQuestionId: string,
  choiceId: string,
) {
  const sessionQuestion = session.questions.find(
    (question) => question.id === sessionQuestionId,
  );

  if (!sessionQuestion) {
    throw new Error("Session question not found.");
  }

  if (sessionQuestion.struckChoiceIds.includes(choiceId)) {
    sessionQuestion.struckChoiceIds = sessionQuestion.struckChoiceIds.filter(
      (id) => id !== choiceId,
    );
    return;
  }

  sessionQuestion.struckChoiceIds.push(choiceId);
}

function stableChoiceOrder(question: DemoQuestionVersion, seed: string) {
  return question.choices
    .map((choice) => ({
      id: choice.label,
      score: seededScore(`${seed}-${choice.label}`),
    }))
    .sort((left, right) => left.score - right.score)
    .map((choice) => choice.id);
}

function scoreQuestionResponse(input: {
  question: DemoQuestionVersion;
  selectedChoiceIds: readonly string[];
  writtenResponses: Record<string, string>;
}) {
  if (input.question.format === "SELECT_TWO") {
    const correct = new Set(getCorrectChoiceIds(input.question));
    const earnedPoints = input.selectedChoiceIds.filter((choiceId) =>
      correct.has(choiceId),
    ).length;

    return {
      earnedPoints,
      maxPoints: 2,
      scoreScale: "NEXTGEN_POINTS" as const,
    };
  }

  if (isWrittenQuestion(input.question)) {
    const rubric = input.question.scoringRubric;

    if (!rubric) {
      throw new Error("Written NextGen questions require a scoring rubric.");
    }

    const earnedPoints = rubric.items.reduce((sum, item) => {
      const responses = item.responseAreaId
        ? [input.writtenResponses[item.responseAreaId] ?? ""]
        : Object.values(input.writtenResponses);
      const matched = responses.some((response) =>
        item.acceptedResponseMarkers.some((marker) =>
          response.toLowerCase().includes(marker.toLowerCase()),
        ),
      );

      return sum + (matched ? item.maxPoints : 0);
    }, 0);

    return {
      earnedPoints,
      maxPoints: rubric.maxPoints,
      scoreScale: rubric.scale,
    };
  }

  const correctChoiceIds = getCorrectChoiceIds(input.question);
  return {
    earnedPoints: sameChoiceSet(input.selectedChoiceIds, correctChoiceIds)
      ? 1
      : 0,
    maxPoints: 1,
    scoreScale: "LEGACY_BINARY" as const,
  };
}

function getQuestionMaxPoints(question: DemoQuestionVersion) {
  if (question.format === "SELECT_TWO") {
    return 2;
  }

  return question.scoringRubric?.maxPoints ?? 1;
}

function isWrittenQuestion(question: DemoQuestionVersion) {
  return [
    "SHORT_ANSWER",
    "MEDIUM_ANSWER",
    "INTEGRATED_SET",
    "STANDARD_PERFORMANCE_TASK",
    "LEGAL_RESEARCH_PERFORMANCE_TASK",
  ].includes(question.format);
}

function seededScore(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function requireChoice(question: DemoQuestionVersion, choiceId: string) {
  const choice = question.choices.find((item) => item.label === choiceId);

  if (!choice) {
    throw new Error("Question choice not found.");
  }

  return choice;
}

function getCorrectChoiceIds(question: DemoQuestionVersion) {
  return question.choices
    .filter((choice) => choice.isCorrect)
    .map((choice) => choice.label);
}

function sameChoiceSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((choiceId) => right.includes(choiceId))
  );
}

function priorityScore(
  question: DemoQuestionVersion,
  priority: readonly string[],
) {
  return priority.reduce((score, topic, index) => {
    if (question.primaryTopic === topic || question.category === topic) {
      return score + priority.length - index;
    }

    return score;
  }, 0);
}

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampQuestionCount(value: number) {
  return Math.max(1, Math.min(50, Math.floor(value)));
}

function normalizeEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
