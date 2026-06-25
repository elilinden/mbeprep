import type { AppRole } from "@/auth/roles";

export const CONTENT_STATUSES = [
  "DRAFT",
  "LEGAL_REVIEW",
  "EDITORIAL_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "RETIRED",
] as const;

export const QUESTION_FORMATS = [
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "SELECT_TWO",
  "SHORT_ANSWER",
  "MEDIUM_ANSWER",
  "INTEGRATED_SET",
  "STANDARD_PERFORMANCE_TASK",
  "LEGAL_RESEARCH_PERFORMANCE_TASK",
] as const;
export const QUESTION_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const DISTRACTOR_TYPES = [
  "NONE",
  "MISSTATEMENT",
  "SCOPE_ERROR",
  "FACT_CONFUSION",
  "OVERGENERALIZATION",
  "IRRELEVANT",
] as const;

export type ContentWorkflowStatus = (typeof CONTENT_STATUSES)[number];
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];
export type DistractorType = (typeof DISTRACTOR_TYPES)[number];
export type ContentKind = "QUESTION" | "ESSAY" | "PODCAST";
export type ExamTrackCode = "LEGACY_UBE" | "NEXTGEN_UBE" | "STATE_SPECIFIC";
export type MasteryDimension = "DOCTRINAL" | "LAWYERING_SKILL";

export type ContentActor = {
  id: string;
  roles: AppRole[];
};

export type DemoChoice = {
  label: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
  distractorType: DistractorType;
};

export type DemoAttachedResource = {
  id: string;
  title: string;
  resourceType: "LEGAL_RESOURCE" | "EXHIBIT" | "FILE" | "LIBRARY";
  content: string;
  citationLabel?: string;
};

export type DemoResponseArea = {
  id: string;
  label: string;
  responseType: "SHORT_TEXT" | "MEDIUM_TEXT" | "MEMO" | "PERFORMANCE_TASK";
  maxWords?: number;
};

export type DemoScoringRubric = {
  version: number;
  maxPoints: number;
  scale: "LEGACY_BINARY" | "NEXTGEN_POINTS";
  items: Array<{
    id: string;
    responseAreaId?: string;
    label: string;
    maxPoints: number;
    acceptedResponseMarkers: string[];
  }>;
};

export type DemoQuestionVersion = {
  id: string;
  subject: string;
  category: string;
  examTrack: ExamTrackCode;
  format: QuestionFormat;
  stem: string;
  callOfQuestion: string;
  choices: DemoChoice[];
  integratedSetId?: string;
  commonFactScenario?: string;
  attachedResources?: DemoAttachedResource[];
  exhibits?: DemoAttachedResource[];
  responseAreas?: DemoResponseArea[];
  setLevelTimingSeconds?: number;
  performanceTaskLibrary?: DemoAttachedResource[];
  scoringRubric?: DemoScoringRubric;
  primaryTopic: string;
  secondaryTopics: string[];
  lawyeringSkillTopic?: string;
  masteryDimension?: MasteryDimension;
  simulationBlueprintKey?: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  licenseKey: string;
  sourceKey: string;
  authorId: string;
  reviewerId?: string;
  batchId?: string;
  provenance?: string;
  publicSourceLabel?: string;
  publishable?: boolean;
  testedIssue?: string;
  governingRule?: string;
  application?: string;
  commonTrap?: string;
  memoryAid?: string;
  authorityNotes?: string[];
  reviewChecklist?: Record<string, boolean>;
  importMetadata?: unknown;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status: ContentWorkflowStatus;
  version: number;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
  lastReviewedAt?: Date | null;
};

export type DemoEssayVersion = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  issue: string;
  sourceYear: number;
  difficulty: QuestionDifficulty;
  examTrack: "LEGACY_UBE" | "NEXTGEN_UBE" | "STATE_SPECIFIC";
  prompt: string;
  callsOfQuestion: string[];
  sampleAnswer: string;
  mode: "FULL_ANSWER" | "OUTLINE_ONLY";
  baseTimerMinutes: number;
  licenseKey: string;
  sourceKey: string;
  version: number;
  effectiveFrom: Date;
  status: ContentWorkflowStatus;
  rubricItems: Array<{
    id: string;
    label: string;
    description: string;
    maxPoints: number;
    taxonomyNodeId: string;
    topic: string;
    ruleStatement: string;
    factApplicationGuidance: string;
    commonMistakes: string[];
  }>;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type DemoPodcastEpisode = {
  id: string;
  title: string;
  status: ContentWorkflowStatus;
  transcriptText?: string | null;
  transcriptUri?: string | null;
  licenseKey?: string | null;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type DemoLicense = {
  key: string;
  copyrightOwner: string;
  expiresAt?: Date | null;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED" | "ARCHIVED" | "DRAFT";
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type DemoContentReport = {
  id: string;
  contentKind: ContentKind;
  reason: string;
  status: "OPEN" | "TRIAGED" | "RESOLVED" | "DISMISSED";
  createdAt: Date;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};
