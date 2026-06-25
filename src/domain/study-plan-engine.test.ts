import { describe, expect, it } from "vitest";

import { calculateTopicPriority, generateStudyPlan } from "./study-plan-engine";
import type { StudyPlanInput, StudyTask } from "./study-plan-types";

describe("study plan engine", () => {
  it("respects capacity constraints unless a pinned task creates overload", () => {
    const plan = generateStudyPlan(baseInput());

    for (const day of plan.days) {
      expect(day.scheduledMinutes).toBeLessThanOrEqual(day.availableMinutes);
      expect(day.overloadMinutes).toBe(0);
    }
  });

  it("preserves rest days", () => {
    const plan = generateStudyPlan(
      baseInput({
        restDays: ["Thursday"],
      }),
    );
    const restDay = plan.days.find((day) => day.date.getUTCDay() === 4);

    expect(restDay?.availableMinutes).toBe(0);
    expect(restDay?.tasks[0]?.taskType).toBe("REST");
  });

  it("preserves pinned tasks during replanning and marks overload explicitly", () => {
    const pinnedTask: StudyTask = {
      id: "pinned-overload",
      taskType: "CUSTOM",
      status: "TODO",
      title: "Pinned custom task",
      estimatedMinutes: 90,
      priority: 80,
      whyAssigned: "Learner pinned this task.",
      dueDate: new Date("2026-06-24T00:00:00.000Z"),
      isPinned: true,
      allowOverload: false,
    };
    const plan = generateStudyPlan(
      baseInput({
        availableMinutesByDay: minutes(30),
        pinnedTasks: [pinnedTask],
      }),
    );
    const task = plan.days[0]?.tasks.find((item) => item.id === pinnedTask.id);

    expect(task?.isPinned).toBe(true);
    expect(task?.allowOverload).toBe(true);
    expect(plan.days[0]?.overloadMinutes).toBeGreaterThan(0);
  });

  it("prioritizes weak topics over strong topics", () => {
    const weak = calculateTopicPriority({
      topic: baseInput().topics[0]!,
      asOf: new Date("2026-06-24T00:00:00.000Z"),
      maxOfficialExamWeight: 1,
    });
    const strong = calculateTopicPriority({
      topic: baseInput().topics[1]!,
      asOf: new Date("2026-06-24T00:00:00.000Z"),
      maxOfficialExamWeight: 1,
    });

    expect(weak.score).toBeGreaterThan(strong.score);
    expect(weak.reason).toContain("Mastery 25/100");
  });

  it("allocates maintenance work for strong subjects", () => {
    const plan = generateStudyPlan(baseInput());
    const maintenance = plan.days
      .flatMap((day) => day.tasks)
      .find((task) => task.whyAssigned.includes("maintenance"));

    expect(maintenance?.taskType).toBe("AUDIO");
  });

  it("does not create an accumulating catch-up pile for missed unpinned work", () => {
    const plan = generateStudyPlan(
      baseInput({
        pinnedTasks: [],
      }),
    );

    expect(
      plan.days
        .flatMap((day) => day.tasks)
        .some((task) => task.title.includes("Missed task from yesterday")),
    ).toBe(false);
  });

  it("increases urgency near the exam by scheduling required simulation", () => {
    const plan = generateStudyPlan(
      baseInput({
        examDate: new Date("2026-07-10T00:00:00.000Z"),
        availableMinutesByDay: minutes(240),
        requiredSimulations: 1,
      }),
    );

    expect(
      plan.days
        .flatMap((day) => day.tasks)
        .some((task) => task.taskType === "SIMULATION"),
    ).toBe(true);
  });

  it("is deterministic with a fixed seed", () => {
    const first = generateStudyPlan(baseInput());
    const second = generateStudyPlan(baseInput());

    expect(JSON.stringify(first.days)).toEqual(JSON.stringify(second.days));
  });
});

function baseInput(overrides: Partial<StudyPlanInput> = {}): StudyPlanInput {
  return {
    userId: "dev-learner",
    today: new Date("2026-06-24T00:00:00.000Z"),
    examDate: new Date("2026-08-01T00:00:00.000Z"),
    examTrackCode: "LEGACY_UBE",
    timeZone: "UTC",
    availableMinutesByDay: minutes(60),
    restDays: [],
    unavailableDates: [],
    topics: [
      {
        taxonomyNodeId: "mbe.category.torts.negligence",
        label: "Negligence",
        subject: "Torts",
        category: "Negligence",
        masteryScore: 25,
        coverageComponent: 0.1,
        dueReviewCount: 1,
        recentErrorCount: 2,
        officialExamWeight: 1,
        nextReviewAt: new Date("2026-06-24T00:00:00.000Z"),
      },
      {
        taxonomyNodeId: "mbe.category.contracts.formation",
        label: "Formation",
        subject: "Contracts",
        category: "Formation",
        masteryScore: 82,
        coverageComponent: 0.8,
        dueReviewCount: 0,
        recentErrorCount: 0,
        officialExamWeight: 1,
        lastPracticedAt: new Date("2026-06-20T00:00:00.000Z"),
      },
    ],
    content: [
      {
        id: "demo-question-2",
        kind: "QUESTION",
        taskType: "QUESTION_SET",
        title: "DEMO_NOT_FOR_PUBLICATION Torts question set",
        subject: "Torts",
        topicId: "mbe.category.torts.negligence",
        topicLabel: "Negligence",
        estimatedMinutes: 25,
        prerequisites: [],
      },
      {
        id: "demo-audio-contracts",
        kind: "PODCAST",
        taskType: "AUDIO",
        title: "DEMO_NOT_FOR_PUBLICATION Contracts maintenance audio",
        subject: "Contracts",
        topicId: "mbe.category.contracts.formation",
        topicLabel: "Formation",
        estimatedMinutes: 10,
        prerequisites: [],
      },
    ],
    pinnedTasks: [],
    requiredSimulations: 0,
    requiredEssayPractice: 0,
    seed: "fixed-seed",
    trigger: "EXPLICIT_REQUEST",
    horizonDays: 7,
    ...overrides,
  };
}

function minutes(value: number) {
  return {
    Monday: value,
    Tuesday: value,
    Wednesday: value,
    Thursday: value,
    Friday: value,
    Saturday: value,
    Sunday: value,
  };
}
