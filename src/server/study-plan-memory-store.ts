import { demoEssays, demoQuestions } from "@/domain/demo-admin-content";
import { demoPodcastLibrary } from "@/domain/demo-podcasts";
import type { DayOfWeek } from "@/domain/onboarding";
import { DAYS_OF_WEEK, getTodayAvailableMinutes } from "@/domain/onboarding";
import type { SavedLearnerProfile } from "@/domain/onboarding-store";
import { generateStudyPlan, toIsoDate } from "@/domain/study-plan-engine";
import type {
  PlanGenerationTrigger,
  StudyContentItem,
  StudyPlan,
  StudyPlanInput,
  StudyTask,
} from "@/domain/study-plan-types";
import { getMasteryAnalyticsForUser } from "@/server/mastery-memory-store";
import { getLearnerProfile } from "@/server/onboarding-repository";

type StudyPlanStoreState = {
  plans: Map<string, StudyPlan>;
  noticeByUser: Map<string, string>;
};

const globalForStudyPlanStore = globalThis as typeof globalThis & {
  __mbeprepStudyPlanStore?: StudyPlanStoreState;
};

function getStore() {
  globalForStudyPlanStore.__mbeprepStudyPlanStore ??= {
    plans: new Map(),
    noticeByUser: new Map(),
  };

  return globalForStudyPlanStore.__mbeprepStudyPlanStore;
}

export async function getOrCreateStudyPlanForUser(input: {
  userId: string;
  trigger?: PlanGenerationTrigger;
  today?: Date;
}) {
  const store = getStore();
  const existing = store.plans.get(input.userId);

  if (existing) {
    return existing;
  }

  return rebuildStudyPlanForUser({
    userId: input.userId,
    trigger: input.trigger ?? "EXPLICIT_REQUEST",
    today: input.today,
  });
}

export async function rebuildStudyPlanForUser(input: {
  userId: string;
  trigger: PlanGenerationTrigger;
  today?: Date;
}) {
  const profile = await getLearnerProfile(input.userId);

  if (!profile?.examDate || !profile.resolvedExamTrackCode) {
    return null;
  }

  const previous = getStore().plans.get(input.userId);
  const planInput = buildStudyPlanInput({
    userId: input.userId,
    profile,
    previousPlan: previous,
    trigger: input.trigger,
    today: input.today ?? new Date(),
  });
  const plan = generateStudyPlan(planInput);
  getStore().plans.set(input.userId, plan);
  getStore().noticeByUser.set(input.userId, "Plan rebuilt.");
  return plan;
}

export async function rebuildStudyPlanAfterOnboarding(userId: string) {
  return rebuildStudyPlanForUser({
    userId,
    trigger: "ONBOARDING",
  });
}

export async function getStudyPlanViewForUser(input: {
  userId: string;
  today?: Date;
}) {
  const plan = await getOrCreateStudyPlanForUser({
    userId: input.userId,
    today: input.today,
  });
  const notice = getStore().noticeByUser.get(input.userId);

  return {
    plan,
    notice,
    today: plan
      ? (plan.days.find(
          (day) => toIsoDate(day.date) === toIsoDate(input.today ?? new Date()),
        ) ??
        plan.days[0] ??
        null)
      : null,
  };
}

export function clearStudyPlanNoticeForUser(userId: string) {
  getStore().noticeByUser.delete(userId);
}

export function completeStudyTaskForUser(input: {
  userId: string;
  taskId: string;
}) {
  const task = requireTask(input.userId, input.taskId);
  task.status = "COMPLETED";
  task.completedAt = new Date();
  getStore().noticeByUser.set(
    input.userId,
    "Task completed. The next plan view reflects the update.",
  );
  return task;
}

export function skipStudyTaskForUser(input: {
  userId: string;
  taskId: string;
  reason: string;
}) {
  const task = requireTask(input.userId, input.taskId);
  task.status = "SKIPPED";
  task.skippedAt = new Date();
  task.skipReason = input.reason.trim() || "Skipped by learner.";
  getStore().noticeByUser.set(
    input.userId,
    "Task skipped. Rebuild the plan if several tasks are missed.",
  );
  return task;
}

export function togglePinStudyTaskForUser(input: {
  userId: string;
  taskId: string;
}) {
  const task = requireTask(input.userId, input.taskId);
  task.isPinned = !task.isPinned;
  getStore().noticeByUser.set(
    input.userId,
    task.isPinned ? "Task pinned for replanning." : "Task unpinned.",
  );
  return task;
}

export function rescheduleStudyTaskForUser(input: {
  userId: string;
  taskId: string;
  date: Date;
}) {
  const plan = requirePlan(input.userId);
  const currentDay = plan.days.find((day) =>
    day.tasks.some((task) => task.id === input.taskId),
  );
  const task = currentDay?.tasks.find((item) => item.id === input.taskId);
  const targetDay = plan.days.find(
    (day) => toIsoDate(day.date) === toIsoDate(input.date),
  );

  if (!currentDay || !task || !targetDay) {
    throw new Error("Study task reschedule target was not found.");
  }

  currentDay.tasks = currentDay.tasks.filter((item) => item.id !== task.id);
  task.dueDate = targetDay.date;
  task.isPinned = true;
  task.allowOverload =
    scheduledMinutes(targetDay) + task.estimatedMinutes >
    targetDay.availableMinutes;
  targetDay.tasks.push(task);
  recalculatePlanDay(targetDay);
  recalculatePlanDay(currentDay);
  getStore().noticeByUser.set(
    input.userId,
    "Task rescheduled and pinned for the next rebuild.",
  );
  return task;
}

export function resetStudyPlanMemoryStoreForTests() {
  globalForStudyPlanStore.__mbeprepStudyPlanStore = {
    plans: new Map(),
    noticeByUser: new Map(),
  };
}

function buildStudyPlanInput(input: {
  userId: string;
  profile: SavedLearnerProfile;
  previousPlan?: StudyPlan;
  trigger: PlanGenerationTrigger;
  today: Date;
}): StudyPlanInput {
  const analytics = getMasteryAnalyticsForUser(input.userId, input.today);
  const availableMinutesByDay = normalizeAvailableMinutes(
    input.profile.availableMinutesByDay,
  );
  const reviewItems = analytics.reviewItems.filter(
    (item) => item.status !== "COMPLETED",
  );
  const reviewCounts = new Map<string, number>();
  const recentErrors = new Map<string, number>();

  for (const item of reviewItems) {
    reviewCounts.set(
      item.taxonomyNodeId,
      (reviewCounts.get(item.taxonomyNodeId) ?? 0) + 1,
    );
    recentErrors.set(
      item.taxonomyNodeId,
      (recentErrors.get(item.taxonomyNodeId) ?? 0) + 1,
    );
  }

  const topicSignals = buildTopicUniverse().map((topic) => {
    const state = analytics.states.find(
      (item) => item.taxonomyNodeId === topic.taxonomyNodeId,
    );
    const dueReviews = reviewItems.filter(
      (item) =>
        item.taxonomyNodeId === topic.taxonomyNodeId &&
        item.dueAt.getTime() <= input.today.getTime(),
    );

    return {
      ...topic,
      masteryScore: state?.overallScore ?? 50,
      coverageComponent: state?.coverageComponent ?? 0,
      nextReviewAt:
        state?.nextReviewAt ??
        dueReviews.toSorted(
          (left, right) => left.dueAt.getTime() - right.dueAt.getTime(),
        )[0]?.dueAt,
      dueReviewCount:
        dueReviews.length || reviewCounts.get(topic.taxonomyNodeId) || 0,
      recentErrorCount: recentErrors.get(topic.taxonomyNodeId) ?? 0,
      lastPracticedAt: state?.lastPracticedAt,
    };
  });

  return {
    userId: input.userId,
    today: input.today,
    examDate: input.profile.examDate!,
    examTrackCode: input.profile.resolvedExamTrackCode!,
    timeZone: input.profile.timeZone ?? "UTC",
    availableMinutesByDay,
    restDays: input.profile.restDay ? [input.profile.restDay] : [],
    unavailableDates: [],
    topics: topicSignals,
    content: buildStudyContent(),
    pinnedTasks:
      input.previousPlan?.days
        .flatMap((day) => day.tasks)
        .filter((task) => task.isPinned && task.status === "TODO") ?? [],
    requiredSimulations:
      daysUntil(input.today, input.profile.examDate!) <= 30 ? 1 : 0,
    requiredEssayPractice: 1,
    seed: `${input.userId}-${toIsoDate(input.profile.examDate!)}-${input.trigger}`,
    trigger: input.trigger,
    horizonDays: 14,
  };
}

function buildTopicUniverse() {
  const byTopic = new Map<
    string,
    {
      taxonomyNodeId: string;
      label: string;
      subject: string;
      category: string;
      officialExamWeight: number;
    }
  >();

  for (const question of demoQuestions.filter(
    (item) => item.status === "PUBLISHED",
  )) {
    byTopic.set(question.primaryTopic, {
      taxonomyNodeId: question.primaryTopic,
      label: question.category,
      subject: question.subject,
      category: question.category,
      officialExamWeight: officialSubjectWeight(question.subject),
    });
  }

  for (const essay of demoEssays.filter(
    (item) => item.status === "PUBLISHED",
  )) {
    for (const rubricItem of essay.rubricItems) {
      byTopic.set(rubricItem.taxonomyNodeId, {
        taxonomyNodeId: rubricItem.taxonomyNodeId,
        label: rubricItem.topic,
        subject: essay.subject,
        category: rubricItem.topic,
        officialExamWeight: officialSubjectWeight(essay.subject),
      });
    }
  }

  for (const episode of demoPodcastLibrary.filter(
    (item) => item.status === "PUBLISHED",
  )) {
    for (const topic of episode.topics) {
      const key = `demo.audio.${episode.subject.toLowerCase().replaceAll(" ", "-")}.${topic.toLowerCase().replaceAll(" ", "-")}`;
      byTopic.set(key, {
        taxonomyNodeId: key,
        label: topic,
        subject: episode.subject,
        category: topic,
        officialExamWeight: officialSubjectWeight(episode.subject),
      });
    }
  }

  return [...byTopic.values()].sort(
    (left, right) =>
      left.subject.localeCompare(right.subject) ||
      left.label.localeCompare(right.label),
  );
}

function buildStudyContent(): StudyContentItem[] {
  const questionContent: StudyContentItem[] = demoQuestions
    .filter((question) => question.status === "PUBLISHED")
    .map((question) => ({
      id: question.id,
      kind: "QUESTION",
      taskType: "QUESTION_SET",
      title: `DEMO_NOT_FOR_PUBLICATION question set: ${question.category}`,
      subject: question.subject,
      topicId: question.primaryTopic,
      topicLabel: question.category,
      estimatedMinutes: Math.ceil(question.estimatedSeconds / 60) + 10,
      prerequisites: [],
    }));
  const essayContent: StudyContentItem[] = demoEssays
    .filter((essay) => essay.status === "PUBLISHED")
    .flatMap((essay) =>
      essay.rubricItems.map((item) => ({
        id: essay.id,
        kind: "ESSAY" as const,
        taskType:
          essay.mode === "FULL_ANSWER"
            ? ("ESSAY_FULL" as const)
            : ("ESSAY_OUTLINE" as const),
        title: `DEMO_NOT_FOR_PUBLICATION essay practice: ${item.topic}`,
        subject: essay.subject,
        topicId: item.taxonomyNodeId,
        topicLabel: item.topic,
        estimatedMinutes: essay.baseTimerMinutes,
        prerequisites: [],
      })),
    );
  const audioContent: StudyContentItem[] = demoPodcastLibrary
    .filter((episode) => episode.status === "PUBLISHED")
    .flatMap((episode) =>
      episode.topics.map((topic) => ({
        id: episode.id,
        kind: "PODCAST" as const,
        taskType: "AUDIO" as const,
        title: episode.title,
        subject: episode.subject,
        topicId: `demo.audio.${episode.subject.toLowerCase().replaceAll(" ", "-")}.${topic.toLowerCase().replaceAll(" ", "-")}`,
        topicLabel: topic,
        estimatedMinutes: Math.max(5, Math.ceil(episode.durationSeconds / 60)),
        prerequisites: [],
      })),
    );

  return [...questionContent, ...essayContent, ...audioContent];
}

function normalizeAvailableMinutes(
  value: SavedLearnerProfile["availableMinutesByDay"],
) {
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [day, Math.max(0, value?.[day] ?? 0)]),
  ) as Record<DayOfWeek, number>;
}

function officialSubjectWeight(subject: string) {
  const weights: Record<string, number> = {
    "Civil Procedure": 1,
    Contracts: 1,
    "Constitutional Law": 1,
    "Criminal Law and Procedure": 1,
    Evidence: 1,
    "Real Property": 1,
    Torts: 1,
  };

  return weights[subject] ?? 0.5;
}

function requirePlan(userId: string) {
  const plan = getStore().plans.get(userId);

  if (!plan) {
    throw new Error("Study plan not found.");
  }

  return plan;
}

function requireTask(userId: string, taskId: string) {
  const plan = requirePlan(userId);
  const task = plan.days
    .flatMap((day) => day.tasks)
    .find((item) => item.id === taskId);

  if (!task) {
    throw new Error("Study task not found.");
  }

  return task;
}

function scheduledMinutes(day: { tasks: StudyTask[] }) {
  return day.tasks
    .filter((task) => task.taskType !== "REST")
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
}

function recalculatePlanDay(day: {
  availableMinutes: number;
  scheduledMinutes: number;
  overloadMinutes: number;
  warning?: string;
  tasks: StudyTask[];
}) {
  day.scheduledMinutes = scheduledMinutes(day);
  day.overloadMinutes = Math.max(
    0,
    day.scheduledMinutes - day.availableMinutes,
  );
  day.warning =
    day.overloadMinutes > 0
      ? `${day.overloadMinutes} overload minutes because pinned work exceeds availability.`
      : undefined;
}

function daysUntil(today: Date, examDate: Date) {
  return Math.ceil(
    (new Date(examDate).setUTCHours(0, 0, 0, 0) -
      new Date(today).setUTCHours(0, 0, 0, 0)) /
      86_400_000,
  );
}

export { getTodayAvailableMinutes };
