import { demoQuestions } from "@/domain/demo-admin-content";
import {
  addMistakeTag,
  buildPracticeReviewSummary,
  buildQuestionExplanation,
  canRevealExplanation,
  createPracticeSession,
  flagSessionQuestion,
  getSafePracticeQuestion,
  normalizePracticeFilters,
  selectPracticeQuestions,
  submitPracticeAnswer,
  toggleStrikeChoice,
} from "@/domain/practice-engine";
import type {
  AttemptConfidence,
  MistakeTag,
  PracticeBuilderFilters,
  PracticeSessionState,
} from "@/domain/practice-types";
import {
  formatExamTrackLabel,
  resolveLearnerPracticeExamTrack,
} from "@/domain/practice-track";
import type { ExamTrackCode } from "@/domain/exam-track";
import { recordQuestionAttemptMasteryEvent } from "@/server/mastery-memory-store";

type PracticeStoreState = {
  sessions: Map<string, PracticeSessionState>;
  startKeys: Map<string, string>;
};

const globalForPracticeStore = globalThis as typeof globalThis & {
  __mbeprepPracticeStore?: PracticeStoreState;
};

function getStore() {
  globalForPracticeStore.__mbeprepPracticeStore ??= {
    sessions: new Map(),
    startKeys: new Map(),
  };

  return globalForPracticeStore.__mbeprepPracticeStore;
}

export function listAvailablePracticeMetadata(examTrack?: ExamTrackCode | null) {
  const published = demoQuestions.filter(
    (question) =>
      question.status === "PUBLISHED" &&
      (!examTrack || question.examTrack === examTrack),
  );

  return {
    subjects: [...new Set(published.map((question) => question.subject))],
    categories: [...new Set(published.map((question) => question.category))],
    subtopics: [...new Set(published.map((question) => question.primaryTopic))],
  };
}

export function startPracticeSession(input: {
  userId: string;
  filters: Partial<PracticeBuilderFilters>;
  idempotencyKey?: string | null;
}) {
  const idempotencyKey = input.idempotencyKey?.trim();
  const startKey = idempotencyKey
    ? `${input.userId}:${idempotencyKey}`
    : undefined;
  const existingSessionId = startKey
    ? getStore().startKeys.get(startKey)
    : undefined;
  const existingSession = existingSessionId
    ? getStore().sessions.get(existingSessionId)
    : undefined;

  if (existingSession) {
    return existingSession;
  }

  const filters = normalizePracticeFilters(input.filters);
  const questions = selectPracticeQuestions({
    questions: demoQuestions,
    filters,
  });

  if (questions.length === 0) {
    throw new Error(
      filters.examTrack
        ? `No questions are available for ${formatExamTrackLabel(filters.examTrack)} with the selected filters.`
        : "No questions are available with the selected filters.",
    );
  }

  const session = createPracticeSession({
    id: `practice-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    userId: input.userId,
    filters: {
      ...filters,
      questionCount: Math.min(filters.questionCount, questions.length),
    },
    questions,
    seed: `${input.userId}-${Date.now()}`,
  });

  getStore().sessions.set(session.id, session);
  if (startKey) {
    getStore().startKeys.set(startKey, session.id);
  }
  return session;
}

export function startLearnerPracticeSession(input: {
  userId: string;
  learnerExamTrack?: ExamTrackCode | null;
  filters: Partial<PracticeBuilderFilters>;
  idempotencyKey?: string | null;
}) {
  const resolved = resolveLearnerPracticeExamTrack({
    learnerExamTrack: input.learnerExamTrack,
    requestedExamTrack: input.filters.examTrack,
  });

  return startPracticeSession({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    filters: {
      ...input.filters,
      examTrack: resolved.examTrack,
    },
  });
}

export function getPracticeSessionForUser(sessionId: string, userId: string) {
  const session = getStore().sessions.get(sessionId);

  if (!session || session.userId !== userId) {
    return null;
  }

  return session;
}

export function getSafeQuestionForUser(input: {
  sessionId: string;
  userId: string;
  position?: number;
}) {
  const session = getPracticeSessionForUser(input.sessionId, input.userId);

  if (!session) {
    return null;
  }

  return getSafePracticeQuestion(session, input.position);
}

export function submitPracticeAnswerForUser(input: {
  sessionId: string;
  userId: string;
  sessionQuestionId: string;
  selectedChoiceIds: string[];
  writtenResponses?: Record<string, string>;
  responseTimeMs: number;
  confidence?: AttemptConfidence;
  answerChanges: number;
  idempotencyKey: string;
}) {
  const session = getPracticeSessionForUser(input.sessionId, input.userId);

  if (!session) {
    throw new Error("Practice session ownership validation failed.");
  }

  const result = submitPracticeAnswer({ session, ...input });
  const sessionQuestion = requireSessionQuestion(
    session,
    input.sessionQuestionId,
  );

  if (!result.duplicate) {
    recordQuestionAttemptMasteryEvent({
      userId: input.userId,
      attempt: result.attempt,
      question: sessionQuestion.question,
    });
  }

  return {
    session,
    attempt: result.attempt,
    duplicate: result.duplicate,
    explanation: canRevealExplanation({
      session,
      sessionQuestionId: input.sessionQuestionId,
    })
      ? buildQuestionExplanation(sessionQuestion.question)
      : null,
  };
}

export function getPracticeQuestionView(input: {
  sessionId: string;
  userId: string;
  position?: number;
}) {
  const session = getPracticeSessionForUser(input.sessionId, input.userId);

  if (!session) {
    return null;
  }

  const safeQuestion = getSafePracticeQuestion(session, input.position);
  const attempt = session.attempts.find(
    (item) => item.sessionQuestionId === safeQuestion.sessionQuestionId,
  );
  const explanation =
    attempt &&
    canRevealExplanation({
      session,
      sessionQuestionId: safeQuestion.sessionQuestionId,
    })
      ? buildQuestionExplanation(
          requireSessionQuestion(session, safeQuestion.sessionQuestionId)
            .question,
        )
      : null;

  return { session, safeQuestion, attempt, explanation };
}

export function getPracticeReviewForUser(sessionId: string, userId: string) {
  const session = getPracticeSessionForUser(sessionId, userId);

  if (!session) {
    return null;
  }

  return {
    session,
    summary: buildPracticeReviewSummary(session),
  };
}

export function setQuestionFlagForUser(input: {
  sessionId: string;
  userId: string;
  sessionQuestionId: string;
  flagged: boolean;
}) {
  const session = requireSession(input.sessionId, input.userId);
  flagSessionQuestion(session, input.sessionQuestionId, input.flagged);
}

export function toggleStrikeForUser(input: {
  sessionId: string;
  userId: string;
  sessionQuestionId: string;
  choiceId: string;
}) {
  const session = requireSession(input.sessionId, input.userId);
  toggleStrikeChoice(session, input.sessionQuestionId, input.choiceId);
}

export function toggleBookmarkForUser(input: {
  sessionId: string;
  userId: string;
  questionVersionId: string;
}) {
  const session = requireSession(input.sessionId, input.userId);

  if (session.bookmarks.has(input.questionVersionId)) {
    session.bookmarks.delete(input.questionVersionId);
    return false;
  }

  session.bookmarks.add(input.questionVersionId);
  return true;
}

export function addQuestionNoteForUser(input: {
  sessionId: string;
  userId: string;
  questionVersionId: string;
  body: string;
}) {
  const session = requireSession(input.sessionId, input.userId);
  const body = input.body.trim();

  if (!body) {
    throw new Error("Question note body is required.");
  }

  session.notes.push({
    id: `question-note-${Date.now()}`,
    questionVersionId: input.questionVersionId,
    body,
    createdAt: new Date(),
  });
}

export function addMistakeTagForUser(input: {
  sessionId: string;
  userId: string;
  attemptId: string;
  tag: MistakeTag;
}) {
  const session = requireSession(input.sessionId, input.userId);
  const attempt = session.attempts.find((item) => item.id === input.attemptId);

  if (!attempt) {
    throw new Error("Question attempt not found.");
  }

  addMistakeTag(attempt, input.tag);
}

export function resetPracticeMemoryStoreForTests() {
  globalForPracticeStore.__mbeprepPracticeStore = {
    sessions: new Map(),
    startKeys: new Map(),
  };
}

function requireSession(sessionId: string, userId: string) {
  const session = getPracticeSessionForUser(sessionId, userId);

  if (!session) {
    throw new Error("Practice session ownership validation failed.");
  }

  return session;
}

function requireSessionQuestion(
  session: PracticeSessionState,
  sessionQuestionId: string,
) {
  const sessionQuestion = session.questions.find(
    (question) => question.id === sessionQuestionId,
  );

  if (!sessionQuestion) {
    throw new Error("Session question not found.");
  }

  return sessionQuestion;
}
