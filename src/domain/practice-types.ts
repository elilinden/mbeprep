import type {
  DemoAttachedResource,
  DemoQuestionVersion,
  DemoResponseArea,
  DistractorType,
  QuestionDifficulty,
  QuestionFormat,
} from "./admin-content-types";

export const PRACTICE_SESSION_MODES = [
  "LEARNING",
  "EXAM",
  "CUSTOM",
  "ADAPTIVE",
] as const;
export const PRACTICE_SESSION_STATUSES = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
] as const;
export const PRACTICE_FEEDBACK_MODES = ["IMMEDIATE", "END_OF_SET"] as const;
export const PRACTICE_TIMING_MODES = ["TIMED", "UNTIMED"] as const;
export const ATTEMPT_CONFIDENCE = ["LOW", "MEDIUM", "HIGH"] as const;
export const MISTAKE_TAGS = [
  "MISREAD_FACTS",
  "MISREAD_CALL",
  "RULE_CONFUSION",
  "TIMING_PRESSURE",
  "SECOND_GUESSING",
  "CONTENT_GAP",
] as const;

export type PracticeSessionMode = (typeof PRACTICE_SESSION_MODES)[number];
export type PracticeSessionStatus = (typeof PRACTICE_SESSION_STATUSES)[number];
export type PracticeFeedbackMode = (typeof PRACTICE_FEEDBACK_MODES)[number];
export type PracticeTimingMode = (typeof PRACTICE_TIMING_MODES)[number];
export type AttemptConfidence = (typeof ATTEMPT_CONFIDENCE)[number];
export type MistakeTag = (typeof MISTAKE_TAGS)[number];

export type PracticeBuilderFilters = {
  mode: PracticeSessionMode;
  examTrack?: DemoQuestionVersion["examTrack"];
  subject?: string;
  category?: string;
  subtopic?: string;
  questionCount: number;
  difficulty?: QuestionDifficulty;
  unseen?: boolean;
  incorrect?: boolean;
  bookmarked?: boolean;
  timingMode: PracticeTimingMode;
  feedbackMode: PracticeFeedbackMode;
  topicPriority?: string[];
};

export type SafePracticeChoice = {
  id: string;
  label: string;
  text: string;
  struck: boolean;
};

export type SafePracticeQuestion = {
  sessionQuestionId: string;
  questionVersionId: string;
  examTrack: DemoQuestionVersion["examTrack"];
  format: QuestionFormat;
  position: number;
  totalQuestions: number;
  mode: PracticeSessionMode;
  feedbackMode: PracticeFeedbackMode;
  timingMode: PracticeTimingMode;
  status: PracticeSessionStatus;
  subject: string;
  category: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  setLevelTimingSeconds?: number;
  stem: string;
  callOfQuestion: string;
  integratedSetId?: string;
  commonFactScenario?: string;
  attachedResources: DemoAttachedResource[];
  exhibits: DemoAttachedResource[];
  performanceTaskLibrary: DemoAttachedResource[];
  responseAreas: DemoResponseArea[];
  choices: SafePracticeChoice[];
  flagged: boolean;
};

export type QuestionExplanation = {
  correctChoiceIds: string[];
  correctAnswer: string;
  earnedPoints?: number;
  maxPoints?: number;
  rubricVersion?: number;
  testedIssue: string;
  governingRule: string;
  application: string;
  choices: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
    rationale: string;
    distractorType: DistractorType;
  }>;
  relatedPodcastTimestamp: string;
  relatedRuleIds: string[];
  relatedQuestionIds: string[];
};

export type PracticeAttempt = {
  id: string;
  sessionQuestionId: string;
  questionVersionId: string;
  selectedChoiceIds: string[];
  responseTimeMs: number;
  confidence?: AttemptConfidence;
  answerChanges: number;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  scoreScale: "LEGACY_BINARY" | "NEXTGEN_POINTS";
  writtenResponses: Record<string, string>;
  submittedAt: Date;
  idempotencyKey: string;
  duplicate: boolean;
  mistakeTags: MistakeTag[];
};

export type PracticeSessionState = {
  id: string;
  userId: string;
  mode: PracticeSessionMode;
  status: PracticeSessionStatus;
  feedbackMode: PracticeFeedbackMode;
  timingMode: PracticeTimingMode;
  filters: PracticeBuilderFilters;
  currentQuestionIndex: number;
  startedAt: Date;
  completedAt?: Date | null;
  questions: Array<{
    id: string;
    question: DemoQuestionVersion;
    position: number;
    choiceOrder: string[];
    flagged: boolean;
    struckChoiceIds: string[];
  }>;
  attempts: PracticeAttempt[];
  bookmarks: Set<string>;
  notes: Array<{
    id: string;
    questionVersionId: string;
    body: string;
    createdAt: Date;
  }>;
};

export type PracticeReviewSummary = {
  score: number;
  total: number;
  accuracy: number;
  averageTimeMs: number;
  byTopic: Array<{ topic: string; correct: number; total: number }>;
  highConfidenceErrors: PracticeAttempt[];
  changedAnswerCount: number;
  incorrectAttempts: PracticeAttempt[];
};
