import {
  MASTERY_ALGORITHM_VERSION,
  type MasteryAlgorithmConfig,
  type MasteryDataConfidence,
  type MasteryEventInput,
  type ReviewItemInput,
  type TopicMasteryResult,
} from "./mastery-types";

export const defaultMasteryConfig: Omit<MasteryAlgorithmConfig, "asOf"> = {
  algorithmVersion: MASTERY_ALGORITHM_VERSION,
  weights: {
    knowledge: 0.4,
    retention: 0.2,
    coverage: 0.15,
    speed: 0.1,
    confidenceCalibration: 0.15,
  },
  bayesianPriorAlpha: 1.5,
  bayesianPriorBeta: 1.5,
  recencyHalfLifeDays: 14,
  targetDistinctRules: 3,
  minimumUniqueExposure: 3,
  reviewIntervalsByScore: [
    { maxScore: 40, days: 1 },
    { maxScore: 60, days: 3 },
    { maxScore: 80, days: 7 },
    { maxScore: 100, days: 14 },
  ],
};

export function calculateTopicMastery(input: {
  userId: string;
  taxonomyNodeId: string;
  topicLabel: string;
  subject: string;
  category: string;
  events: readonly MasteryEventInput[];
  config: MasteryAlgorithmConfig;
}): TopicMasteryResult {
  const events = [...input.events].sort(
    (left, right) =>
      left.occurredAt.getTime() - right.occurredAt.getTime() ||
      left.id.localeCompare(right.id),
  );
  const weightedEvents = applyRepeatedQuestionWeights(events);
  const totalWeight = weightedEvents.reduce(
    (sum, event) => sum + event.weight,
    0,
  );
  const correctWeight = weightedEvents.reduce(
    (sum, event) => sum + (event.event.isCorrect ? event.weight : 0),
    0,
  );
  const knowledgeComponent =
    (input.config.bayesianPriorAlpha + correctWeight) /
    (input.config.bayesianPriorAlpha +
      input.config.bayesianPriorBeta +
      totalWeight);
  const lastPracticedAt = events.at(-1)?.occurredAt;
  const retentionComponent = lastPracticedAt
    ? calculateRecencyDecay({
        asOf: input.config.asOf,
        occurredAt: lastPracticedAt,
        halfLifeDays: input.config.recencyHalfLifeDays,
      })
    : 0;
  const distinctRules = new Set(
    events.map((event) => event.ruleKey ?? event.questionKey).filter(Boolean),
  );
  const coverageComponent = Math.min(
    1,
    distinctRules.size / input.config.targetDistinctRules,
  );
  const rawSpeedComponent = calculateSpeedComponent(events);
  const speedComponent =
    knowledgeComponent >= 0.6
      ? rawSpeedComponent
      : Math.min(0.5, rawSpeedComponent);
  const confidenceCalibrationComponent =
    calculateConfidenceCalibrationComponent(events);
  const overallFraction =
    input.config.weights.knowledge * knowledgeComponent +
    input.config.weights.retention * retentionComponent +
    input.config.weights.coverage * coverageComponent +
    input.config.weights.speed * speedComponent +
    input.config.weights.confidenceCalibration * confidenceCalibrationComponent;
  const uniqueExposureCount = new Set(events.map((event) => event.questionKey))
    .size;
  const overallScore = Math.max(
    0,
    Math.min(100, Math.round(overallFraction * 100)),
  );
  const dataConfidence = calculateDataConfidence(
    uniqueExposureCount,
    events.length,
    input.config.minimumUniqueExposure,
  );
  const nextReviewAt = lastPracticedAt
    ? addDays(lastPracticedAt, reviewIntervalDays(overallScore, input.config))
    : input.config.asOf;

  return {
    userId: input.userId,
    taxonomyNodeId: input.taxonomyNodeId,
    topicLabel: input.topicLabel,
    subject: input.subject,
    category: input.category,
    algorithmVersion: input.config.algorithmVersion,
    knowledgeComponent: roundComponent(knowledgeComponent),
    retentionComponent: roundComponent(retentionComponent),
    coverageComponent: roundComponent(coverageComponent),
    speedComponent: roundComponent(speedComponent),
    confidenceCalibrationComponent: roundComponent(
      confidenceCalibrationComponent,
    ),
    overallScore,
    dataConfidence,
    uniqueExposureCount,
    eventCount: events.length,
    lastPracticedAt,
    nextReviewAt,
    explanation: {
      summary: `${input.topicLabel} is ${overallScore}/100 using ${input.config.algorithmVersion}.`,
      reasons: [
        `Knowledge uses Bayesian-smoothed accuracy with ${correctWeight.toFixed(2)} correct weighted attempts out of ${totalWeight.toFixed(2)}.`,
        `Repeated questions receive less weight after the first exposure.`,
        `Retention is based on the most recent practice date and a ${input.config.recencyHalfLifeDays}-day half-life.`,
        `Coverage includes ${distinctRules.size} distinct reviewed rules or question topics.`,
        knowledgeComponent >= 0.6
          ? "Timing contributes because accuracy cleared the timing gate."
          : "Timing is capped because accuracy has not cleared the timing gate.",
        `Confidence calibration rewards confidence that matches correctness and penalizes high-confidence errors.`,
        dataConfidence === "LOW"
          ? `This state is provisional until ${input.config.minimumUniqueExposure} unique exposures.`
          : `This state has ${dataConfidence.toLowerCase()} data confidence.`,
      ],
    },
  };
}

export function recalculateAllMastery(input: {
  userId: string;
  events: readonly MasteryEventInput[];
  config: MasteryAlgorithmConfig;
}) {
  const byTopic = new Map<string, MasteryEventInput[]>();

  for (const event of input.events) {
    if (event.userId !== input.userId) {
      continue;
    }

    const existing = byTopic.get(event.taxonomyNodeId) ?? [];
    existing.push(event);
    byTopic.set(event.taxonomyNodeId, existing);
  }

  return [...byTopic.entries()]
    .map(([taxonomyNodeId, events]) => {
      const first = events[0]!;
      return calculateTopicMastery({
        userId: input.userId,
        taxonomyNodeId,
        topicLabel: first.topicLabel,
        subject: first.subject,
        category: first.category,
        events,
        config: input.config,
      });
    })
    .sort((left, right) => left.topicLabel.localeCompare(right.topicLabel));
}

export function shouldCreateReviewItem(event: MasteryEventInput) {
  return (
    !event.isCorrect ||
    (event.isCorrect && event.confidence === "LOW") ||
    (!event.isCorrect && event.confidence === "HIGH")
  );
}

export function createReviewItemFromEvent(input: {
  event: MasteryEventInput;
  mastery: TopicMasteryResult;
  now: Date;
}): ReviewItemInput {
  const highConfidenceError =
    !input.event.isCorrect && input.event.confidence === "HIGH";
  const source = input.event.isCorrect
    ? "LOW_CONFIDENCE_CORRECT"
    : highConfidenceError
      ? "HIGH_CONFIDENCE_ERROR"
      : "QUESTION_INCORRECT";

  return {
    id: `review-${input.event.id}`,
    userId: input.event.userId,
    taxonomyNodeId: input.event.taxonomyNodeId,
    topic: input.event.topicLabel,
    rule: input.event.ruleKey,
    source,
    questionVersionId: input.event.questionKey,
    questionAttemptId: input.event.id,
    criticalFact:
      input.event.criticalFact ??
      "DEMO_NOT_FOR_PUBLICATION critical fact placeholder.",
    studentAnswer:
      input.event.studentAnswer ??
      "DEMO_NOT_FOR_PUBLICATION student answer placeholder.",
    correctAnswer:
      input.event.correctAnswer ??
      "DEMO_NOT_FOR_PUBLICATION correct answer placeholder.",
    errorReason:
      input.event.errorReason ??
      (highConfidenceError
        ? "High-confidence error"
        : input.event.isCorrect
          ? "Low-confidence correct answer"
          : "Incorrect answer"),
    relatedPodcast:
      input.event.relatedPodcast ?? "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
    dueAt: input.mastery.nextReviewAt ?? input.now,
    status: "OPEN",
    history: [],
  };
}

export function createRuleDueReviewItem(input: {
  id: string;
  userId: string;
  taxonomyNodeId: string;
  topic: string;
  ruleKey: string;
  dueAt: Date;
}) {
  return {
    id: input.id,
    userId: input.userId,
    taxonomyNodeId: input.taxonomyNodeId,
    topic: input.topic,
    rule: input.ruleKey,
    source: "RULE_REVIEW_DUE" as const,
    criticalFact: "DEMO_NOT_FOR_PUBLICATION rule review due.",
    studentAnswer: "DEMO_NOT_FOR_PUBLICATION pending review.",
    correctAnswer: "DEMO_NOT_FOR_PUBLICATION reviewed rule.",
    errorReason: "Rule reached its review-due date.",
    relatedPodcast: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
    dueAt: input.dueAt,
    status: "DUE" as const,
    history: [],
  };
}

export function createEssayRubricMissReviewItem(input: {
  id: string;
  userId: string;
  taxonomyNodeId: string;
  topic: string;
  rubricItem: string;
  dueAt: Date;
}) {
  return {
    id: input.id,
    userId: input.userId,
    taxonomyNodeId: input.taxonomyNodeId,
    topic: input.topic,
    source: "ESSAY_RUBRIC_MISS" as const,
    criticalFact: input.rubricItem,
    studentAnswer: "DEMO_NOT_FOR_PUBLICATION essay answer placeholder.",
    correctAnswer: "DEMO_NOT_FOR_PUBLICATION rubric expectation placeholder.",
    errorReason: "Essay rubric item missed.",
    relatedPodcast: "DEMO_NOT_FOR_PUBLICATION podcast 00:30",
    dueAt: input.dueAt,
    status: "OPEN" as const,
    history: [],
  };
}

export function buildMasteryConfig(asOf: Date): MasteryAlgorithmConfig {
  return {
    ...defaultMasteryConfig,
    asOf,
  };
}

function applyRepeatedQuestionWeights(events: readonly MasteryEventInput[]) {
  const exposureCount = new Map<string, number>();

  return events.map((event) => {
    const key = event.questionKey ?? event.id;
    const count = exposureCount.get(key) ?? 0;
    exposureCount.set(key, count + 1);

    return {
      event,
      weight:
        (event.eventWeight ?? 1) * (count === 0 ? 1 : count === 1 ? 0.5 : 0.25),
    };
  });
}

function calculateRecencyDecay(input: {
  asOf: Date;
  occurredAt: Date;
  halfLifeDays: number;
}) {
  const ageDays = Math.max(
    0,
    (input.asOf.getTime() - input.occurredAt.getTime()) / 86_400_000,
  );

  return Math.pow(0.5, ageDays / input.halfLifeDays);
}

function calculateSpeedComponent(events: readonly MasteryEventInput[]) {
  const correctTimed = events.filter(
    (event) =>
      event.isCorrect &&
      event.responseTimeMs != null &&
      event.estimatedSeconds != null &&
      event.estimatedSeconds > 0,
  );

  if (correctTimed.length === 0) {
    return 0.5;
  }

  const scores = correctTimed.map((event) => {
    const targetMs = event.estimatedSeconds! * 1000;
    return Math.max(
      0,
      Math.min(1, targetMs / Math.max(1, event.responseTimeMs!)),
    );
  });

  return average(scores);
}

function calculateConfidenceCalibrationComponent(
  events: readonly MasteryEventInput[],
) {
  const confidentEvents = events.filter((event) => event.confidence);

  if (confidentEvents.length === 0) {
    return 0.5;
  }

  return average(
    confidentEvents.map((event) => {
      if (event.confidence === "HIGH" && !event.isCorrect) {
        return 0.05;
      }

      if (event.confidence === "LOW" && event.isCorrect) {
        return 0.55;
      }

      const expected =
        event.confidence === "LOW"
          ? 0.35
          : event.confidence === "MEDIUM"
            ? 0.65
            : 0.85;
      const actual = event.isCorrect ? 1 : 0;
      return Math.max(0, 1 - Math.abs(expected - actual));
    }),
  );
}

function calculateDataConfidence(
  uniqueExposureCount: number,
  eventCount: number,
  minimumUniqueExposure: number,
): MasteryDataConfidence {
  if (uniqueExposureCount < minimumUniqueExposure) {
    return "LOW";
  }

  if (eventCount >= minimumUniqueExposure * 2) {
    return "HIGH";
  }

  return "MEDIUM";
}

function reviewIntervalDays(score: number, config: MasteryAlgorithmConfig) {
  return (
    config.reviewIntervalsByScore.find((interval) => score <= interval.maxScore)
      ?.days ?? 14
  );
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function roundComponent(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

function average(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
