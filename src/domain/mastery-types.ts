import type { AttemptConfidence } from "./practice-types";

export const MASTERY_ALGORITHM_VERSION = "DEMO_MASTERY_V1" as const;

export type MasteryDataConfidence = "LOW" | "MEDIUM" | "HIGH";

export type MasteryEventInput = {
  id: string;
  userId: string;
  taxonomyNodeId: string;
  topicLabel: string;
  subject: string;
  category: string;
  questionKey?: string;
  ruleKey?: string;
  essayAttemptId?: string;
  essayRubricItemId?: string;
  eventWeight?: number;
  isCorrect: boolean;
  confidence?: AttemptConfidence;
  responseTimeMs?: number;
  estimatedSeconds?: number;
  occurredAt: Date;
  studentAnswer?: string;
  correctAnswer?: string;
  criticalFact?: string;
  errorReason?: string;
  relatedPodcast?: string;
};

export type MasteryAlgorithmConfig = {
  algorithmVersion: typeof MASTERY_ALGORITHM_VERSION;
  weights: {
    knowledge: number;
    retention: number;
    coverage: number;
    speed: number;
    confidenceCalibration: number;
  };
  bayesianPriorAlpha: number;
  bayesianPriorBeta: number;
  recencyHalfLifeDays: number;
  targetDistinctRules: number;
  minimumUniqueExposure: number;
  reviewIntervalsByScore: Array<{ maxScore: number; days: number }>;
  asOf: Date;
};

export type MasteryExplanation = {
  summary: string;
  reasons: string[];
};

export type TopicMasteryResult = {
  userId: string;
  taxonomyNodeId: string;
  topicLabel: string;
  subject: string;
  category: string;
  algorithmVersion: string;
  knowledgeComponent: number;
  retentionComponent: number;
  coverageComponent: number;
  speedComponent: number;
  confidenceCalibrationComponent: number;
  overallScore: number;
  dataConfidence: MasteryDataConfidence;
  uniqueExposureCount: number;
  eventCount: number;
  lastPracticedAt?: Date;
  nextReviewAt?: Date;
  explanation: MasteryExplanation;
};

export type ReviewItemInput = {
  id: string;
  userId: string;
  taxonomyNodeId: string;
  topic: string;
  rule?: string;
  source:
    | "QUESTION_INCORRECT"
    | "LOW_CONFIDENCE_CORRECT"
    | "HIGH_CONFIDENCE_ERROR"
    | "ESSAY_RUBRIC_MISS"
    | "RULE_REVIEW_DUE";
  questionVersionId?: string;
  questionAttemptId?: string;
  essayAttemptId?: string;
  essayRubricItemId?: string;
  criticalFact: string;
  studentAnswer: string;
  correctAnswer: string;
  errorReason: string;
  relatedPodcast?: string;
  dueAt: Date;
  status: "OPEN" | "DUE" | "COMPLETED" | "ARCHIVED";
  history: Array<{
    outcome: "REVIEWED" | "CORRECT" | "INCORRECT" | "SNOOZED";
    createdAt: Date;
  }>;
};
