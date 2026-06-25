import type { DemoQuestionVersion } from "@/domain/admin-content-types";
import {
  buildMasteryConfig,
  calculateTopicMastery,
  createEssayRubricMissReviewItem,
  createReviewItemFromEvent,
  createRuleDueReviewItem,
  recalculateAllMastery,
  shouldCreateReviewItem,
} from "@/domain/mastery-engine";
import type {
  MasteryEventInput,
  ReviewItemInput,
  TopicMasteryResult,
} from "@/domain/mastery-types";
import type { PracticeAttempt } from "@/domain/practice-types";

type MasteryStoreState = {
  events: MasteryEventInput[];
  states: Map<string, TopicMasteryResult>;
  reviewItems: ReviewItemInput[];
};

const globalForMasteryStore = globalThis as typeof globalThis & {
  __mbeprepMasteryStore?: MasteryStoreState;
};

function getStore() {
  globalForMasteryStore.__mbeprepMasteryStore ??= {
    events: [],
    states: new Map(),
    reviewItems: [],
  };

  return globalForMasteryStore.__mbeprepMasteryStore;
}

export function recordQuestionAttemptMasteryEvent(input: {
  userId: string;
  attempt: PracticeAttempt;
  question: DemoQuestionVersion;
  occurredAt?: Date;
}) {
  const event: MasteryEventInput = {
    id: input.attempt.id,
    userId: input.userId,
    taxonomyNodeId: input.question.primaryTopic,
    topicLabel: input.question.category,
    subject: input.question.subject,
    category: input.question.category,
    questionKey: input.question.id,
    ruleKey: input.question.primaryTopic,
    isCorrect: input.attempt.isCorrect,
    confidence: input.attempt.confidence,
    responseTimeMs: input.attempt.responseTimeMs,
    estimatedSeconds: input.question.estimatedSeconds,
    occurredAt: input.occurredAt ?? input.attempt.submittedAt,
    eventWeight:
      input.attempt.maxPoints > 0
        ? Math.max(0.25, input.attempt.earnedPoints / input.attempt.maxPoints)
        : 1,
    studentAnswer: formatAttemptAnswer(input.attempt),
    correctAnswer: formatCorrectAnswer(input.question),
    criticalFact: "DEMO_NOT_FOR_PUBLICATION critical fact placeholder.",
    errorReason: input.attempt.isCorrect
      ? input.attempt.confidence === "LOW"
        ? "Low-confidence correct answer"
        : "Correct answer"
      : input.attempt.confidence === "HIGH"
        ? "High-confidence error"
        : "Incorrect answer",
    relatedPodcast: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
  };

  const store = getStore();
  const events = [event, createLawyeringSkillEvent(event, input.question)];

  for (const candidate of events) {
    if (
      candidate &&
      !store.events.some((existing) => existing.id === candidate.id)
    ) {
      store.events.push(candidate);
    }
  }

  const mastery = calculateTopicMastery({
    userId: input.userId,
    taxonomyNodeId: event.taxonomyNodeId,
    topicLabel: event.topicLabel,
    subject: event.subject,
    category: event.category,
    events: store.events.filter(
      (candidate) =>
        candidate.userId === input.userId &&
        candidate.taxonomyNodeId === event.taxonomyNodeId,
    ),
    config: buildMasteryConfig(event.occurredAt),
  });
  store.states.set(stateKey(input.userId, event.taxonomyNodeId), mastery);

  if (shouldCreateReviewItem(event)) {
    upsertReviewItem(
      createReviewItemFromEvent({
        event,
        mastery,
        now: event.occurredAt,
      }),
    );
  }

  return { event, mastery };
}

function createLawyeringSkillEvent(
  event: MasteryEventInput,
  question: DemoQuestionVersion,
) {
  if (
    question.examTrack !== "NEXTGEN_UBE" ||
    !question.lawyeringSkillTopic ||
    question.lawyeringSkillTopic === question.primaryTopic
  ) {
    return null;
  }

  return {
    ...event,
    id: `${event.id}-skill`,
    taxonomyNodeId: question.lawyeringSkillTopic,
    topicLabel: question.lawyeringSkillTopic,
    subject: "NextGen Lawyering Skills",
    category: question.category,
    ruleKey: question.lawyeringSkillTopic,
  };
}

function formatAttemptAnswer(attempt: PracticeAttempt) {
  if (Object.keys(attempt.writtenResponses).length > 0) {
    return Object.entries(attempt.writtenResponses)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }

  return attempt.selectedChoiceIds.join(", ");
}

function formatCorrectAnswer(question: DemoQuestionVersion) {
  const choiceAnswer = question.choices
    .filter((choice) => choice.isCorrect)
    .map((choice) => choice.label)
    .join(", ");

  return (
    choiceAnswer ||
    `DEMO_NOT_FOR_PUBLICATION rubric version ${question.scoringRubric?.version ?? 1}`
  );
}

export function recalculateMasteryForUser(userId: string, asOf = new Date()) {
  const store = getStore();
  const states = recalculateAllMastery({
    userId,
    events: store.events,
    config: buildMasteryConfig(asOf),
  });

  for (const state of states) {
    store.states.set(stateKey(userId, state.taxonomyNodeId), state);
  }

  return states;
}

export function getMasteryAnalyticsForUser(userId: string, asOf = new Date()) {
  const store = getStore();
  const states = recalculateMasteryForUser(userId, asOf);
  const reviewItems = store.reviewItems.filter(
    (item) => item.userId === userId,
  );

  return {
    states,
    reviewItems,
    subjects: groupStatesBySubject(states, reviewItems, asOf),
  };
}

export function getReviewItemsForUser(userId: string) {
  return getStore().reviewItems.filter((item) => item.userId === userId);
}

export function recordEssayMasteryArtifacts(input: {
  events: MasteryEventInput[];
  reviewItems: ReviewItemInput[];
}) {
  const store = getStore();
  const masteryResults: TopicMasteryResult[] = [];

  for (const event of input.events) {
    if (!store.events.some((existing) => existing.id === event.id)) {
      store.events.push(event);
    }

    const mastery = calculateTopicMastery({
      userId: event.userId,
      taxonomyNodeId: event.taxonomyNodeId,
      topicLabel: event.topicLabel,
      subject: event.subject,
      category: event.category,
      events: store.events.filter(
        (candidate) =>
          candidate.userId === event.userId &&
          candidate.taxonomyNodeId === event.taxonomyNodeId,
      ),
      config: buildMasteryConfig(event.occurredAt),
    });
    store.states.set(stateKey(event.userId, event.taxonomyNodeId), mastery);
    masteryResults.push(mastery);
  }

  for (const item of input.reviewItems) {
    upsertReviewItem(item);
  }

  return masteryResults;
}

export function addEssayRubricMissForUser(input: {
  userId: string;
  taxonomyNodeId: string;
  topic: string;
  rubricItem: string;
  dueAt: Date;
}) {
  const item = createEssayRubricMissReviewItem({
    id: `review-essay-${Date.now()}`,
    ...input,
  });
  upsertReviewItem(item);
  return item;
}

export function addRuleDueReviewForUser(input: {
  userId: string;
  taxonomyNodeId: string;
  topic: string;
  ruleKey: string;
  dueAt: Date;
}) {
  const item = createRuleDueReviewItem({
    id: `review-rule-${Date.now()}`,
    ...input,
  });
  upsertReviewItem(item);
  return item;
}

export function resetMasteryMemoryStoreForTests() {
  globalForMasteryStore.__mbeprepMasteryStore = {
    events: [],
    states: new Map(),
    reviewItems: [],
  };
}

function upsertReviewItem(item: ReviewItemInput) {
  const store = getStore();
  const index = store.reviewItems.findIndex(
    (existing) => existing.id === item.id,
  );

  if (index >= 0) {
    store.reviewItems[index] = item;
    return;
  }

  store.reviewItems.push(item);
}

function groupStatesBySubject(
  states: readonly TopicMasteryResult[],
  reviewItems: readonly ReviewItemInput[],
  asOf: Date,
) {
  const bySubject = new Map<
    string,
    {
      subject: string;
      overallScore: number;
      dueReviewCount: number;
      categories: TopicMasteryResult[];
    }
  >();

  for (const state of states) {
    const dueReviewCount = reviewItems.filter(
      (item) =>
        item.taxonomyNodeId === state.taxonomyNodeId &&
        item.status !== "COMPLETED" &&
        item.dueAt.getTime() <= asOf.getTime(),
    ).length;
    const current = bySubject.get(state.subject) ?? {
      subject: state.subject,
      overallScore: 0,
      dueReviewCount: 0,
      categories: [],
    };
    current.categories.push(state);
    current.dueReviewCount += dueReviewCount;
    current.overallScore = Math.round(
      current.categories.reduce((sum, item) => sum + item.overallScore, 0) /
        current.categories.length,
    );
    bySubject.set(state.subject, current);
  }

  return [...bySubject.values()].sort((left, right) =>
    left.subject.localeCompare(right.subject),
  );
}

function stateKey(userId: string, taxonomyNodeId: string) {
  return `${userId}:${taxonomyNodeId}`;
}
