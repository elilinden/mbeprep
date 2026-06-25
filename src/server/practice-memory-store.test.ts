import { beforeEach, describe, expect, it } from "vitest";

import {
  resetPracticeMemoryStoreForTests,
  startLearnerPracticeSession,
} from "./practice-memory-store";

describe("learner practice session creation", () => {
  beforeEach(() => {
    resetPracticeMemoryStoreForTests();
  });

  it("creates default Legacy UBE sessions with only legacy-compatible questions", () => {
    const session = startLearnerPracticeSession({
      userId: "legacy-learner",
      learnerExamTrack: "LEGACY_UBE",
      filters: {
        mode: "LEARNING",
        questionCount: 3,
        timingMode: "UNTIMED",
        feedbackMode: "IMMEDIATE",
      },
      idempotencyKey: "legacy-default",
    });

    expect(session.filters.examTrack).toBe("LEGACY_UBE");
    expect(
      session.questions.every(
        (sessionQuestion) =>
          sessionQuestion.question.examTrack === "LEGACY_UBE",
      ),
    ).toBe(true);
  });

  it("creates default NextGen UBE sessions with only NextGen-compatible content", () => {
    const session = startLearnerPracticeSession({
      userId: "nextgen-learner",
      learnerExamTrack: "NEXTGEN_UBE",
      filters: {
        mode: "LEARNING",
        questionCount: 3,
        timingMode: "UNTIMED",
        feedbackMode: "IMMEDIATE",
      },
      idempotencyKey: "nextgen-default",
    });

    expect(session.filters.examTrack).toBe("NEXTGEN_UBE");
    expect(
      session.questions.every(
        (sessionQuestion) =>
          sessionQuestion.question.examTrack === "NEXTGEN_UBE",
      ),
    ).toBe(true);
  });

  it("normalizes incompatible requested tracks safely", () => {
    const session = startLearnerPracticeSession({
      userId: "legacy-learner",
      learnerExamTrack: "LEGACY_UBE",
      filters: {
        mode: "LEARNING",
        examTrack: "NEXTGEN_UBE",
        questionCount: 2,
        timingMode: "UNTIMED",
        feedbackMode: "IMMEDIATE",
      },
      idempotencyKey: "tampered-track",
    });

    expect(session.filters.examTrack).toBe("LEGACY_UBE");
    expect(
      session.questions.every(
        (sessionQuestion) =>
          sessionQuestion.question.examTrack === "LEGACY_UBE",
      ),
    ).toBe(true);
  });

  it("returns the original session for duplicate start submissions", () => {
    const input = {
      userId: "legacy-learner",
      learnerExamTrack: "LEGACY_UBE" as const,
      filters: {
        mode: "LEARNING" as const,
        questionCount: 1,
        timingMode: "UNTIMED" as const,
        feedbackMode: "IMMEDIATE" as const,
      },
      idempotencyKey: "same-start",
    };

    const first = startLearnerPracticeSession(input);
    const second = startLearnerPracticeSession(input);

    expect(second.id).toBe(first.id);
  });

  it("shows a useful empty state instead of falling back to another track", () => {
    expect(() =>
      startLearnerPracticeSession({
        userId: "state-specific-learner",
        learnerExamTrack: "STATE_SPECIFIC",
        filters: {
          mode: "LEARNING",
          questionCount: 1,
          timingMode: "UNTIMED",
          feedbackMode: "IMMEDIATE",
        },
        idempotencyKey: "empty-bank",
      }),
    ).toThrow(
      "No questions are available for State-specific with the selected filters.",
    );
  });
});
