import type { DemoEssayVersion } from "./admin-content-types";

export const ESSAY_SELF_ASSESSMENT_RELIABILITY_WEIGHT = 0.6;

export type EssayAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "ABANDONED";

export type EssayResponseMode = "FULL_ANSWER" | "OUTLINE_ONLY";

export type EssayLibraryFilters = {
  examTrack?: DemoEssayVersion["examTrack"];
  subject?: string;
  topic?: string;
  issue?: string;
  sourceYear?: number;
  difficulty?: DemoEssayVersion["difficulty"];
  completed?: boolean;
  uncompleted?: boolean;
  fullAnswer?: boolean;
  outlineOnly?: boolean;
};

export type EssayAttemptState = {
  id: string;
  userId: string;
  essayVersionId: string;
  status: EssayAttemptStatus;
  responseMode: EssayResponseMode;
  timerMinutes: number;
  extendedTimeMultiplier: number;
  outline: string;
  answer: string;
  wordCount: number;
  startedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  idempotencyKey?: string;
  autosaves: EssayAutosaveState[];
  assessment?: EssaySelfAssessmentState;
  notes: EssayNoteState[];
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type EssayAutosaveState = {
  id: string;
  essayAttemptId: string;
  outline: string;
  answer: string;
  wordCount: number;
  clientSavedAt?: Date;
  savedAt: Date;
};

export type EssayNoteState = {
  id: string;
  body: string;
  createdAt: Date;
};

export type EssaySelfAssessmentItemState = {
  rubricItemId: string;
  missed: boolean;
  awardedPoints: number;
  notes?: string;
};

export type EssaySelfAssessmentState = {
  id: string;
  essayAttemptId: string;
  essayVersionId: string;
  rubricVersion: number;
  totalPoints: number;
  earnedPoints: number;
  reliabilityWeight: number;
  notes?: string;
  submittedAt: Date;
  items: EssaySelfAssessmentItemState[];
};

export type SafeEssayLibraryItem = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  issue: string;
  sourceYear: number;
  difficulty: DemoEssayVersion["difficulty"];
  examTrack: DemoEssayVersion["examTrack"];
  mode: EssayResponseMode;
  baseTimerMinutes: number;
  completed: boolean;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type SafeEssayWorkspace = SafeEssayLibraryItem & {
  attemptId: string;
  prompt: string;
  callsOfQuestion: string[];
  timerMinutes: number;
  extendedTimeMultiplier: number;
  outline: string;
  answer: string;
  wordCount: number;
  autosavedAt?: Date;
};

export type EssayReviewMaterial = SafeEssayWorkspace & {
  studentAnswer: string;
  sampleAnswer: string;
  issueChecklist: Array<{
    id: string;
    label: string;
    description: string;
    maxPoints: number;
    topic: string;
    ruleStatement: string;
    factApplicationGuidance: string;
    commonMistakes: string[];
  }>;
  assessment?: EssaySelfAssessmentState;
};

export type EssayFeedbackProviderJob = {
  id: string;
  attemptId: string;
  providerKey: string;
  status: "PENDING" | "READY" | "FAILED" | "DISABLED";
  requestMetadata?: Record<string, unknown>;
  resultMetadata?: Record<string, unknown>;
  errorMessage?: string;
};

export type EssayFeedbackProvider = {
  key: string;
  requestFeedback(input: {
    attempt: EssayAttemptState;
    essay: DemoEssayVersion;
  }): Promise<EssayFeedbackProviderJob>;
};
