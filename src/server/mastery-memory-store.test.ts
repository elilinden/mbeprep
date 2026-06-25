import { beforeEach, describe, expect, it } from "vitest";

import { demoQuestions } from "@/domain/demo-admin-content";
import type { PracticeAttempt } from "@/domain/practice-types";

import {
  getMasteryAnalyticsForUser,
  getReviewItemsForUser,
  recordQuestionAttemptMasteryEvent,
  resetMasteryMemoryStoreForTests,
} from "./mastery-memory-store";

describe("mastery memory store", () => {
  beforeEach(() => {
    resetMasteryMemoryStoreForTests();
  });

  it("keeps learner analytics scoped by user", () => {
    recordQuestionAttemptMasteryEvent({
      userId: "dev-learner",
      attempt: attempt(false, "HIGH"),
      question: demoQuestions.find(
        (question) => question.id === "demo-question-2",
      )!,
      occurredAt: new Date("2026-06-24T00:00:00.000Z"),
    });

    expect(getMasteryAnalyticsForUser("dev-learner").states).toHaveLength(1);
    expect(getMasteryAnalyticsForUser("other-user").states).toHaveLength(0);
  });

  it("creates an automatic review item for high-confidence errors", () => {
    recordQuestionAttemptMasteryEvent({
      userId: "dev-learner",
      attempt: attempt(false, "HIGH"),
      question: demoQuestions.find(
        (question) => question.id === "demo-question-2",
      )!,
      occurredAt: new Date("2026-06-24T00:00:00.000Z"),
    });

    const [item] = getReviewItemsForUser("dev-learner");
    expect(item?.topic).toBe("Negligence");
    expect(item?.source).toBe("HIGH_CONFIDENCE_ERROR");
  });
});

function attempt(
  isCorrect: boolean,
  confidence: PracticeAttempt["confidence"],
): PracticeAttempt {
  return {
    id: "attempt-1",
    sessionQuestionId: "session-question-1",
    questionVersionId: "demo-question-2",
    selectedChoiceIds: ["A"],
    responseTimeMs: 50_000,
    confidence,
    answerChanges: 0,
    isCorrect,
    earnedPoints: isCorrect ? 1 : 0,
    maxPoints: 1,
    scoreScale: "LEGACY_BINARY",
    writtenResponses: {},
    submittedAt: new Date("2026-06-24T00:00:00.000Z"),
    idempotencyKey: "attempt-1",
    duplicate: false,
    mistakeTags: [],
  };
}
