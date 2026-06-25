import { DAYS_OF_WEEK, type DayOfWeek } from "./onboarding";
import {
  STUDY_PLAN_ALGORITHM_VERSION,
  type PlanGenerationRun,
  type StudyContentItem,
  type StudyDay,
  type StudyPlan,
  type StudyPlanInput,
  type StudyTask,
  type StudyTaskType,
  type StudyTopicSignal,
  type TopicPriority,
} from "./study-plan-types";

const DAY_MS = 86_400_000;
const SUBJECT_STREAK_LIMIT = 2;

export function calculateTopicPriority(input: {
  topic: StudyTopicSignal;
  asOf: Date;
  maxOfficialExamWeight: number;
}): TopicPriority {
  const weakness = clamp01((100 - input.topic.masteryScore) / 100);
  const dueReview = clamp01(input.topic.dueReviewCount / 3);
  const coverageGap = clamp01(1 - input.topic.coverageComponent);
  const examWeight = clamp01(
    input.maxOfficialExamWeight > 0
      ? input.topic.officialExamWeight / input.maxOfficialExamWeight
      : input.topic.officialExamWeight,
  );
  const recency = input.topic.lastPracticedAt
    ? clamp01(daysBetween(input.topic.lastPracticedAt, input.asOf) / 21)
    : 1;
  const recentErrors = clamp01(input.topic.recentErrorCount / 3);
  const score =
    100 *
    (0.4 * weakness +
      0.2 * dueReview +
      0.15 * coverageGap +
      0.1 * examWeight +
      0.05 * recency +
      0.1 * recentErrors);

  return {
    topic: input.topic,
    score: Math.round(score),
    components: {
      weakness,
      dueReview,
      coverageGap,
      examWeight,
      recency,
      recentErrors,
    },
    reason: [
      `${input.topic.label} priority ${Math.round(score)}/100.`,
      `Mastery ${input.topic.masteryScore}/100 drives weakness weight.`,
      input.topic.dueReviewCount > 0
        ? `${input.topic.dueReviewCount} due review item${input.topic.dueReviewCount === 1 ? "" : "s"} included.`
        : "No due reviews currently.",
      `Coverage gap contributes ${Math.round(coverageGap * 100)}%.`,
      `Official exam weighting contributes ${Math.round(examWeight * 100)}%.`,
      input.topic.recentErrorCount > 0
        ? `${input.topic.recentErrorCount} recent error${input.topic.recentErrorCount === 1 ? "" : "s"} increased priority.`
        : "No recent errors increased priority.",
    ].join(" "),
  };
}

export function generateStudyPlan(input: StudyPlanInput): StudyPlan {
  const startsOn = dateOnly(input.today);
  const daysUntilExam = Math.max(0, daysBetween(startsOn, input.examDate));
  const horizonDays = Math.max(
    1,
    Math.min(input.horizonDays ?? 14, Math.max(1, daysUntilExam)),
  );
  const endsOn = addDays(startsOn, horizonDays - 1);
  const maxOfficialExamWeight = Math.max(
    0,
    ...input.topics.map((topic) => topic.officialExamWeight),
  );
  const priorities = input.topics
    .map((topic) =>
      calculateTopicPriority({
        topic,
        asOf: startsOn,
        maxOfficialExamWeight,
      }),
    )
    .sort(sortPriority);
  const requiredMinutes = estimateRequiredMinutes(input, priorities);
  const days = buildDays(input, startsOn, horizonDays);
  const availableMinutes = days.reduce(
    (sum, day) => sum + day.availableMinutes,
    0,
  );
  const planId = stableId(input.seed, "plan", input.userId, startsOn);
  const warning =
    requiredMinutes > availableMinutes
      ? `Remaining schedule is mathematically unrealistic: ${requiredMinutes} required minutes exceed ${availableMinutes} available minutes in this planning window.`
      : undefined;

  placePinnedTasks(input.pinnedTasks, days, input.seed);
  scheduleDueReviews({ days, priorities, seed: input.seed });
  scheduleRequiredWork({
    days,
    priorities,
    content: input.content,
    requiredEssayPractice: input.requiredEssayPractice,
    requiredSimulations: input.requiredSimulations,
    seed: input.seed,
    examUrgency: calculateExamUrgency(daysUntilExam),
  });
  recalculateDayTotals(days);

  const run: PlanGenerationRun = {
    id: stableId(input.seed, "run", input.trigger, startsOn),
    trigger: input.trigger,
    status: "COMPLETED",
    seed: input.seed,
    algorithmVersion: STUDY_PLAN_ALGORITHM_VERSION,
    inputSummary: {
      availableMinutes,
      requiredMinutes,
      topicCount: input.topics.length,
      pinnedTaskCount: input.pinnedTasks.length,
    },
    warning,
    startedAt: startsOn,
    finishedAt: startsOn,
  };

  return {
    id: planId,
    userId: input.userId,
    examDate: input.examDate,
    examTrackCode: input.examTrackCode,
    timeZone: input.timeZone,
    startsOn,
    endsOn,
    algorithmVersion: STUDY_PLAN_ALGORITHM_VERSION,
    seed: input.seed,
    unavailableDates: input.unavailableDates,
    unrealisticWarning: warning,
    days,
    generationRun: run,
    dataClassification: "DEMO_NOT_FOR_PUBLICATION",
  };
}

export function findNextAvailableDay(input: {
  plan: StudyPlan;
  fromDate: Date;
}) {
  const from = toIsoDate(input.fromDate);
  return input.plan.days.find(
    (day) =>
      toIsoDate(day.date) >= from &&
      !day.isRestDay &&
      !day.isUnavailable &&
      day.availableMinutes > day.scheduledMinutes,
  );
}

function buildDays(input: StudyPlanInput, startsOn: Date, horizonDays: number) {
  const unavailable = new Set(input.unavailableDates);

  return Array.from({ length: horizonDays }, (_, index): StudyDay => {
    const date = addDays(startsOn, index);
    const dayOfWeek = dayName(date);
    const isRestDay = input.restDays.includes(dayOfWeek);
    const isUnavailable = unavailable.has(toIsoDate(date));
    const availableMinutes =
      isRestDay || isUnavailable
        ? 0
        : Math.max(0, input.availableMinutesByDay[dayOfWeek] ?? 0);

    return {
      id: stableId(input.seed, "day", date),
      date,
      availableMinutes,
      scheduledMinutes: 0,
      overloadMinutes: 0,
      isRestDay,
      isUnavailable,
      warning:
        isRestDay || isUnavailable
          ? isRestDay
            ? "Rest day preserved."
            : "Unavailable date preserved."
          : undefined,
      tasks:
        isRestDay || isUnavailable
          ? [
              createTask({
                seed: input.seed,
                date,
                index: 0,
                taskType: "REST",
                title: isRestDay ? "Rest day" : "Unavailable",
                estimatedMinutes: 0,
                priority: 0,
                whyAssigned: isRestDay
                  ? "This day is marked as a rest day in availability."
                  : "This date is marked unavailable.",
                dueDate: date,
              }),
            ]
          : [],
    };
  });
}

function placePinnedTasks(
  pinnedTasks: readonly StudyTask[],
  days: StudyDay[],
  seed: string,
) {
  for (const task of pinnedTasks) {
    const target =
      days.find((day) => toIsoDate(day.date) === toIsoDate(task.dueDate)) ??
      days[0];

    if (!target) {
      continue;
    }

    const scheduled = target.tasks
      .filter((item) => item.taskType !== "REST")
      .reduce((sum, item) => sum + item.estimatedMinutes, 0);
    const wouldOverload =
      scheduled + task.estimatedMinutes > target.availableMinutes;

    target.tasks.push({
      ...task,
      id: task.id || stableId(seed, "pinned", task.title, target.date),
      isPinned: true,
      allowOverload: wouldOverload,
      whyAssigned: `${task.whyAssigned} Pinned tasks are preserved during replanning.`,
    });
  }
}

function scheduleDueReviews(input: {
  days: StudyDay[];
  priorities: readonly TopicPriority[];
  seed: string;
}) {
  for (const priority of input.priorities) {
    if (priority.topic.dueReviewCount <= 0) {
      continue;
    }

    const dueDate = priority.topic.nextReviewAt ?? input.days[0]?.date;
    const day = pickDayForMinutes({
      days: input.days,
      minutes: 15,
      dueDate,
      subject: priority.topic.subject,
    });

    if (!day) {
      continue;
    }

    day.tasks.push(
      createTopicTask({
        seed: input.seed,
        day,
        priority,
        taskType: "REVIEW",
        title: `Review ${priority.topic.label}`,
        estimatedMinutes: 15,
        dueDate: dueDate ?? day.date,
        whyAssigned: `${priority.reason} Due reviews are scheduled before new work.`,
      }),
    );
  }
}

function scheduleRequiredWork(input: {
  days: StudyDay[];
  priorities: readonly TopicPriority[];
  content: readonly StudyContentItem[];
  requiredSimulations: number;
  requiredEssayPractice: number;
  seed: string;
  examUrgency: number;
}) {
  let mixedPracticeCount = 0;
  let essayCount = 0;
  let simulationCount = 0;
  const targetTasks = Math.max(1, input.days.filter(hasCapacity).length * 2);

  for (let index = 0; index < targetTasks; index += 1) {
    const priority = pickInterleavedPriority(input.priorities, input.days);

    if (!priority) {
      continue;
    }

    const dueDate = input.days[Math.min(input.days.length - 1, index)]?.date;
    const day = pickDayForMinutes({
      days: input.days,
      minutes: 25,
      dueDate,
      subject: priority.topic.subject,
    });

    if (!day) {
      continue;
    }

    const taskType = chooseTaskType({
      index,
      priority,
      mixedPracticeCount,
      essayCount,
      simulationCount,
      requiredEssayPractice: input.requiredEssayPractice,
      requiredSimulations: input.requiredSimulations,
      examUrgency: input.examUrgency,
    });
    const content = pickContentForTask({
      content: input.content,
      taskType,
      topic: priority.topic,
    });
    const estimatedMinutes = estimateTaskMinutes(taskType, content);

    if (remainingCapacity(day) < estimatedMinutes) {
      continue;
    }

    if (taskType === "MIXED_QUESTION_SET") {
      mixedPracticeCount += 1;
    }
    if (taskType === "ESSAY_FULL" || taskType === "ESSAY_OUTLINE") {
      essayCount += 1;
    }
    if (taskType === "SIMULATION") {
      simulationCount += 1;
    }

    day.tasks.push(
      createTopicTask({
        seed: input.seed,
        day,
        priority,
        taskType,
        title: content?.title ?? titleForTask(taskType, priority.topic.label),
        estimatedMinutes,
        dueDate: day.date,
        content,
        whyAssigned: buildTaskReason({ priority, taskType }),
      }),
    );
  }

  addMaintenanceWork(input.days, input.priorities, input.content, input.seed);
}

function addMaintenanceWork(
  days: StudyDay[],
  priorities: readonly TopicPriority[],
  content: readonly StudyContentItem[],
  seed: string,
) {
  const strongTopics = priorities
    .filter((priority) => priority.topic.masteryScore >= 70)
    .sort(
      (left, right) =>
        left.topic.label.localeCompare(right.topic.label) ||
        left.score - right.score,
    );

  for (const priority of strongTopics.slice(0, 2)) {
    const day = pickDayForMinutes({
      days,
      minutes: 10,
      subject: priority.topic.subject,
    });

    if (!day) {
      continue;
    }

    const contentItem = pickContentForTask({
      content,
      taskType: "AUDIO",
      topic: priority.topic,
    });
    day.tasks.push(
      createTopicTask({
        seed,
        day,
        priority,
        taskType: "AUDIO",
        title: contentItem?.title ?? `Maintain ${priority.topic.label}`,
        estimatedMinutes: 10,
        dueDate: day.date,
        content: contentItem,
        whyAssigned: `${priority.topic.label} is comparatively strong, so it receives a short maintenance task instead of dominating the schedule.`,
      }),
    );
  }
}

function chooseTaskType(input: {
  index: number;
  priority: TopicPriority;
  mixedPracticeCount: number;
  essayCount: number;
  simulationCount: number;
  requiredEssayPractice: number;
  requiredSimulations: number;
  examUrgency: number;
}): StudyTaskType {
  if (
    input.requiredSimulations > input.simulationCount &&
    input.examUrgency > 0.55 &&
    input.index % 6 === 0
  ) {
    return "SIMULATION";
  }

  if (
    input.requiredEssayPractice > input.essayCount &&
    input.priority.topic.subject === "Contracts"
  ) {
    return input.index % 2 === 0 ? "ESSAY_FULL" : "ESSAY_OUTLINE";
  }

  if (input.index % 3 === 2 && input.mixedPracticeCount < 4) {
    return "MIXED_QUESTION_SET";
  }

  if (input.priority.topic.masteryScore < 45) {
    return "QUESTION_SET";
  }

  return input.index % 2 === 0 ? "AUDIO" : "QUESTION_SET";
}

function pickContentForTask(input: {
  content: readonly StudyContentItem[];
  taskType: StudyTaskType;
  topic: StudyTopicSignal;
}) {
  return (
    input.content.find(
      (item) =>
        item.taskType === input.taskType &&
        item.topicId === input.topic.taxonomyNodeId,
    ) ??
    input.content.find(
      (item) =>
        item.subject === input.topic.subject &&
        compatibleTask(item.taskType, input.taskType),
    )
  );
}

function compatibleTask(left: StudyTaskType, right: StudyTaskType) {
  if (left === right) {
    return true;
  }

  return (
    (right === "MIXED_QUESTION_SET" && left === "QUESTION_SET") ||
    (right === "ESSAY_OUTLINE" && left === "ESSAY_FULL")
  );
}

function pickInterleavedPriority(
  priorities: readonly TopicPriority[],
  days: readonly StudyDay[],
) {
  const recentSubjects = days
    .flatMap((day) => day.tasks)
    .filter((task) => task.relatedSubject)
    .slice(-SUBJECT_STREAK_LIMIT)
    .map((task) => task.relatedSubject);

  if (
    recentSubjects.length >= SUBJECT_STREAK_LIMIT &&
    new Set(recentSubjects).size === 1
  ) {
    const alternate = priorities.find(
      (priority) => priority.topic.subject !== recentSubjects[0],
    );

    if (alternate) {
      return alternate;
    }
  }

  return priorities[0];
}

function pickDayForMinutes(input: {
  days: StudyDay[];
  minutes: number;
  dueDate?: Date;
  subject?: string;
}) {
  const sorted = [...input.days].sort((left, right) => {
    const due = input.dueDate ? input.dueDate.getTime() : left.date.getTime();
    const leftDistance = Math.abs(left.date.getTime() - due);
    const rightDistance = Math.abs(right.date.getTime() - due);
    return (
      leftDistance - rightDistance || left.date.getTime() - right.date.getTime()
    );
  });

  return sorted.find(
    (day) =>
      hasCapacity(day) &&
      remainingCapacity(day) >= input.minutes &&
      !createsSubjectStreak(day, input.subject),
  );
}

function createsSubjectStreak(day: StudyDay, subject?: string) {
  if (!subject) {
    return false;
  }

  const subjects = day.tasks
    .filter((task) => task.relatedSubject)
    .map((task) => task.relatedSubject);
  return (
    subjects.length >= SUBJECT_STREAK_LIMIT &&
    subjects.slice(-SUBJECT_STREAK_LIMIT).every((item) => item === subject)
  );
}

function hasCapacity(day: StudyDay) {
  return !day.isRestDay && !day.isUnavailable && day.availableMinutes > 0;
}

function remainingCapacity(day: StudyDay) {
  const scheduled = day.tasks
    .filter((task) => task.taskType !== "REST")
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  return Math.max(0, day.availableMinutes - scheduled);
}

function createTopicTask(input: {
  seed: string;
  day: StudyDay;
  priority: TopicPriority;
  taskType: StudyTaskType;
  title: string;
  estimatedMinutes: number;
  dueDate: Date;
  whyAssigned: string;
  content?: StudyContentItem;
}) {
  return createTask({
    seed: input.seed,
    date: input.day.date,
    index: input.day.tasks.length,
    taskType: input.taskType,
    title: input.title,
    estimatedMinutes: input.estimatedMinutes,
    priority: input.priority.score,
    relatedContentKind: input.content?.kind,
    relatedContentId: input.content?.id,
    relatedContentLabel: input.content?.title,
    relatedTopicId: input.priority.topic.taxonomyNodeId,
    relatedTopicLabel: input.priority.topic.label,
    relatedSubject: input.priority.topic.subject,
    whyAssigned: input.whyAssigned,
    dueDate: input.dueDate,
  });
}

function createTask(input: {
  seed: string;
  date: Date;
  index: number;
  taskType: StudyTaskType;
  title: string;
  estimatedMinutes: number;
  priority: number;
  whyAssigned: string;
  dueDate: Date;
  relatedContentKind?: StudyTask["relatedContentKind"];
  relatedContentId?: string;
  relatedContentLabel?: string;
  relatedTopicId?: string;
  relatedTopicLabel?: string;
  relatedSubject?: string;
}): StudyTask {
  return {
    id: stableId(input.seed, "task", input.date, input.index, input.title),
    taskType: input.taskType,
    status: "TODO",
    title: input.title,
    estimatedMinutes: input.estimatedMinutes,
    priority: input.priority,
    relatedContentKind: input.relatedContentKind,
    relatedContentId: input.relatedContentId,
    relatedContentLabel: input.relatedContentLabel,
    relatedTopicId: input.relatedTopicId,
    relatedTopicLabel: input.relatedTopicLabel,
    relatedSubject: input.relatedSubject,
    whyAssigned: input.whyAssigned,
    dueDate: dateOnly(input.dueDate),
    isPinned: false,
    allowOverload: false,
  };
}

function recalculateDayTotals(days: StudyDay[]) {
  for (const day of days) {
    const scheduled = day.tasks
      .filter((task) => task.taskType !== "REST")
      .reduce((sum, task) => sum + task.estimatedMinutes, 0);
    day.scheduledMinutes = scheduled;
    day.overloadMinutes = Math.max(0, scheduled - day.availableMinutes);
    if (day.overloadMinutes > 0) {
      day.warning = `${day.overloadMinutes} overload minute${day.overloadMinutes === 1 ? "" : "s"} because pinned work exceeds availability.`;
    }
  }
}

function estimateRequiredMinutes(
  input: StudyPlanInput,
  priorities: readonly TopicPriority[],
) {
  const weakTopicMinutes =
    priorities.filter((item) => item.score >= 45).length * 25;
  const dueReviewMinutes = priorities.reduce(
    (sum, item) => sum + item.topic.dueReviewCount * 15,
    0,
  );
  return (
    weakTopicMinutes +
    dueReviewMinutes +
    input.requiredEssayPractice * 30 +
    input.requiredSimulations * 180
  );
}

function estimateTaskMinutes(
  taskType: StudyTaskType,
  content?: StudyContentItem,
) {
  if (content) {
    return content.estimatedMinutes;
  }

  if (taskType === "SIMULATION") {
    return 180;
  }
  if (taskType === "ESSAY_FULL") {
    return 30;
  }
  if (taskType === "ESSAY_OUTLINE") {
    return 20;
  }
  if (taskType === "AUDIO") {
    return 15;
  }
  if (taskType === "REVIEW") {
    return 15;
  }
  return 25;
}

function titleForTask(taskType: StudyTaskType, topic: string) {
  if (taskType === "MIXED_QUESTION_SET") {
    return "Mixed question set";
  }
  if (taskType === "ESSAY_FULL") {
    return `Full essay: ${topic}`;
  }
  if (taskType === "ESSAY_OUTLINE") {
    return `Essay outline: ${topic}`;
  }
  if (taskType === "SIMULATION") {
    return "Timed simulation";
  }
  if (taskType === "AUDIO") {
    return `Audio review: ${topic}`;
  }
  return `Question set: ${topic}`;
}

function buildTaskReason(input: {
  priority: TopicPriority;
  taskType: StudyTaskType;
}) {
  const prefix =
    input.taskType === "MIXED_QUESTION_SET"
      ? "Regular mixed practice is included to interleave subjects."
      : input.taskType === "SIMULATION"
        ? "Simulation practice is required before the exam."
        : input.taskType === "ESSAY_FULL" || input.taskType === "ESSAY_OUTLINE"
          ? "Required essay practice is included in the plan."
          : "Assigned from topic priority.";

  return `${prefix} ${input.priority.reason}`;
}

function calculateExamUrgency(daysUntilExam: number) {
  if (daysUntilExam <= 0) {
    return 1;
  }

  return clamp01(1 - daysUntilExam / 60);
}

function sortPriority(left: TopicPriority, right: TopicPriority) {
  return (
    right.score - left.score ||
    right.topic.officialExamWeight - left.topic.officialExamWeight ||
    left.topic.subject.localeCompare(right.topic.subject) ||
    left.topic.label.localeCompare(right.topic.label)
  );
}

function dayName(date: Date) {
  return DAYS_OF_WEEK[
    (date.getUTCDay() + 6) % DAYS_OF_WEEK.length
  ] as DayOfWeek;
}

function addDays(date: Date, days: number) {
  return new Date(dateOnly(date).getTime() + days * DAY_MS);
}

function daysBetween(left: Date, right: Date) {
  return Math.ceil(
    (dateOnly(right).getTime() - dateOnly(left).getTime()) / DAY_MS,
  );
}

function dateOnly(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function toIsoDate(date: Date) {
  return dateOnly(date).toISOString().slice(0, 10);
}

function stableId(seed: string, ...parts: Array<string | number | Date>) {
  const input = `${seed}:${parts
    .map((part) => (part instanceof Date ? toIsoDate(part) : String(part)))
    .join(":")}`;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return `study-${hash.toString(36)}`;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
