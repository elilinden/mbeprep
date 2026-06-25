import type { ContentKind } from "./admin-content-types";
import type { DayOfWeek } from "./onboarding";

export const STUDY_PLAN_ALGORITHM_VERSION = "DEMO_STUDY_PLAN_V1" as const;

export type StudyTaskType =
  | "AUDIO"
  | "QUESTION_SET"
  | "MIXED_QUESTION_SET"
  | "REVIEW"
  | "ESSAY_FULL"
  | "ESSAY_OUTLINE"
  | "SIMULATION"
  | "REST"
  | "CUSTOM";

export type StudyTaskStatus = "TODO" | "COMPLETED" | "SKIPPED";

export type PlanGenerationTrigger =
  | "ONBOARDING"
  | "AVAILABILITY_CHANGE"
  | "NIGHTLY"
  | "DIAGNOSTIC"
  | "SIMULATION"
  | "MISSED_TASKS"
  | "EXPLICIT_REQUEST";

export type StudyTopicSignal = {
  taxonomyNodeId: string;
  label: string;
  subject: string;
  category: string;
  masteryScore: number;
  coverageComponent: number;
  nextReviewAt?: Date;
  dueReviewCount: number;
  recentErrorCount: number;
  officialExamWeight: number;
  lastPracticedAt?: Date;
};

export type StudyContentItem = {
  id: string;
  kind: ContentKind;
  taskType: StudyTaskType;
  title: string;
  subject: string;
  topicId: string;
  topicLabel: string;
  estimatedMinutes: number;
  prerequisites: string[];
};

export type StudyPlanInput = {
  userId: string;
  today: Date;
  examDate: Date;
  examTrackCode: "LEGACY_UBE" | "NEXTGEN_UBE" | "STATE_SPECIFIC";
  timeZone: string;
  availableMinutesByDay: Record<DayOfWeek, number>;
  restDays: DayOfWeek[];
  unavailableDates: string[];
  topics: StudyTopicSignal[];
  content: StudyContentItem[];
  pinnedTasks: StudyTask[];
  requiredSimulations: number;
  requiredEssayPractice: number;
  seed: string;
  trigger: PlanGenerationTrigger;
  horizonDays?: number;
};

export type TopicPriority = {
  topic: StudyTopicSignal;
  score: number;
  components: {
    weakness: number;
    dueReview: number;
    coverageGap: number;
    examWeight: number;
    recency: number;
    recentErrors: number;
  };
  reason: string;
};

export type StudyPlan = {
  id: string;
  userId: string;
  examDate: Date;
  examTrackCode: StudyPlanInput["examTrackCode"];
  timeZone: string;
  startsOn: Date;
  endsOn: Date;
  algorithmVersion: typeof STUDY_PLAN_ALGORITHM_VERSION;
  seed: string;
  unavailableDates: string[];
  unrealisticWarning?: string;
  days: StudyDay[];
  generationRun: PlanGenerationRun;
  dataClassification: "DEMO_NOT_FOR_PUBLICATION";
};

export type StudyDay = {
  id: string;
  date: Date;
  availableMinutes: number;
  scheduledMinutes: number;
  overloadMinutes: number;
  isRestDay: boolean;
  isUnavailable: boolean;
  warning?: string;
  tasks: StudyTask[];
};

export type StudyTask = {
  id: string;
  taskType: StudyTaskType;
  status: StudyTaskStatus;
  title: string;
  estimatedMinutes: number;
  priority: number;
  relatedContentKind?: ContentKind;
  relatedContentId?: string;
  relatedContentLabel?: string;
  relatedTopicId?: string;
  relatedTopicLabel?: string;
  relatedSubject?: string;
  whyAssigned: string;
  dueDate: Date;
  isPinned: boolean;
  allowOverload: boolean;
  completedAt?: Date;
  skippedAt?: Date;
  skipReason?: string;
};

export type PlanGenerationRun = {
  id: string;
  trigger: PlanGenerationTrigger;
  status: "COMPLETED" | "FAILED";
  seed: string;
  algorithmVersion: typeof STUDY_PLAN_ALGORITHM_VERSION;
  inputSummary: {
    availableMinutes: number;
    requiredMinutes: number;
    topicCount: number;
    pinnedTaskCount: number;
  };
  warning?: string;
  startedAt: Date;
  finishedAt: Date;
};
