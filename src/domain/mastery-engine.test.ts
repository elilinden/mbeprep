import { describe, expect, it } from "vitest";

import {
  buildMasteryConfig,
  calculateTopicMastery,
  createReviewItemFromEvent,
  recalculateAllMastery,
} from "./mastery-engine";
import type { MasteryEventInput } from "./mastery-types";

const asOf = new Date("2026-06-24T00:00:00.000Z");

describe("mastery engine", () => {
  it("calculates deterministic mastery for the same event history", () => {
    const first = calculateTopicMastery(baseInput(events()));
    const second = calculateTopicMastery(baseInput(events().reverse()));

    expect(second).toEqual(first);
    expect(first.algorithmVersion).toBe("DEMO_MASTERY_V1");
  });

  it("reduces weight for repeated questions", () => {
    const repeated = calculateTopicMastery(
      baseInput([
        event({ id: "a", questionKey: "same", isCorrect: true }),
        event({ id: "b", questionKey: "same", isCorrect: true }),
      ]),
    );
    const unique = calculateTopicMastery(
      baseInput([
        event({ id: "a", questionKey: "one", isCorrect: true }),
        event({ id: "b", questionKey: "two", isCorrect: true }),
      ]),
    );

    expect(repeated.knowledgeComponent).toBeLessThan(unique.knowledgeComponent);
  });

  it("applies recency decay", () => {
    const current = calculateTopicMastery(
      baseInput([event({ occurredAt: new Date("2026-06-24T00:00:00.000Z") })]),
    );
    const older = calculateTopicMastery(
      baseInput([event({ occurredAt: new Date("2026-05-24T00:00:00.000Z") })]),
    );

    expect(older.retentionComponent).toBeLessThan(current.retentionComponent);
  });

  it("marks early states as provisional with low confidence", () => {
    const mastery = calculateTopicMastery(baseInput([event()]));

    expect(mastery.dataConfidence).toBe("LOW");
    expect(mastery.explanation.reasons.join(" ")).toContain("provisional");
  });

  it("penalizes high-confidence errors and creates review items", () => {
    const highConfidenceError = event({
      isCorrect: false,
      confidence: "HIGH",
      studentAnswer: "B",
      correctAnswer: "A",
    });
    const mastery = calculateTopicMastery(baseInput([highConfidenceError]));
    const reviewItem = createReviewItemFromEvent({
      event: highConfidenceError,
      mastery,
      now: asOf,
    });

    expect(mastery.confidenceCalibrationComponent).toBe(0.05);
    expect(reviewItem.source).toBe("HIGH_CONFIDENCE_ERROR");
    expect(reviewItem.errorReason).toBe("High-confidence error");
  });

  it("recalculates complete mastery from immutable events", () => {
    const states = recalculateAllMastery({
      userId: "dev-learner",
      events: [
        event({ taxonomyNodeId: "topic-a", topicLabel: "Topic A" }),
        event({ taxonomyNodeId: "topic-b", topicLabel: "Topic B" }),
      ],
      config: buildMasteryConfig(asOf),
    });

    expect(states.map((state) => state.topicLabel)).toEqual([
      "Topic A",
      "Topic B",
    ]);
  });

  it("schedules review sooner for lower scores", () => {
    const low = calculateTopicMastery(
      baseInput([event({ isCorrect: false, confidence: "HIGH" })]),
    );
    const stronger = calculateTopicMastery(
      baseInput([
        event({
          id: "a",
          questionKey: "a",
          isCorrect: true,
          confidence: "HIGH",
        }),
        event({
          id: "b",
          questionKey: "b",
          isCorrect: true,
          confidence: "HIGH",
        }),
        event({
          id: "c",
          questionKey: "c",
          isCorrect: true,
          confidence: "HIGH",
        }),
      ]),
    );

    expect(low.nextReviewAt!.getTime()).toBeLessThan(
      stronger.nextReviewAt!.getTime(),
    );
  });
});

function baseInput(eventsInput: MasteryEventInput[]) {
  return {
    userId: "dev-learner",
    taxonomyNodeId: "mbe.category.torts.negligence",
    topicLabel: "Negligence",
    subject: "Torts",
    category: "Negligence",
    events: eventsInput,
    config: buildMasteryConfig(asOf),
  };
}

function events() {
  return [
    event({ id: "a", questionKey: "a", isCorrect: true }),
    event({ id: "b", questionKey: "b", isCorrect: false }),
    event({ id: "c", questionKey: "c", isCorrect: true }),
  ];
}

function event(overrides: Partial<MasteryEventInput> = {}): MasteryEventInput {
  return {
    id: "event",
    userId: "dev-learner",
    taxonomyNodeId: "mbe.category.torts.negligence",
    topicLabel: "Negligence",
    subject: "Torts",
    category: "Negligence",
    questionKey: "demo-question",
    ruleKey: "mbe.category.torts.negligence",
    isCorrect: true,
    confidence: "MEDIUM",
    responseTimeMs: 60_000,
    estimatedSeconds: 90,
    occurredAt: asOf,
    studentAnswer: "A",
    correctAnswer: "A",
    ...overrides,
  };
}
