import { describe, expect, it } from "vitest";

import { demoQuestions } from "./demo-admin-content";
import {
  assertSafeInitialPayload,
  buildPracticeReviewSummary,
  buildQuestionExplanation,
  canRevealExplanation,
  createPracticeSession,
  getSafePracticeQuestion,
  normalizePracticeFilters,
  selectPracticeQuestions,
  submitPracticeAnswer,
} from "./practice-engine";

const publishedQuestions = demoQuestions.filter(
  (question) => question.status === "PUBLISHED",
);
const publishedLegacyQuestions = publishedQuestions.filter(
  (question) => question.examTrack === "LEGACY_UBE",
);

describe("practice engine", () => {
  it("builds pre-submission payloads without answer keys or explanations", () => {
    const session = demoSession("LEARNING");
    const safeQuestion = getSafePracticeQuestion(session);

    expect(assertSafeInitialPayload(safeQuestion)).toEqual([]);
    expect(JSON.stringify(safeQuestion)).not.toContain("isCorrect");
    expect(JSON.stringify(safeQuestion)).not.toContain("rationale");
    expect(JSON.stringify(safeQuestion)).not.toContain("correctAnswer");
  });

  it("blocks imported original-review metadata from pre-submission payloads", () => {
    const session = createPracticeSession({
      id: "session-original-metadata",
      userId: "dev-learner",
      filters: normalizePracticeFilters({
        mode: "LEARNING",
        examTrack: "LEGACY_UBE",
        questionCount: 1,
        timingMode: "UNTIMED",
        feedbackMode: "IMMEDIATE",
      }),
      questions: [
        {
          ...publishedLegacyQuestions[0]!,
          governingRule: "DEMO_NOT_FOR_PUBLICATION governing rule.",
          application: "DEMO_NOT_FOR_PUBLICATION application.",
          commonTrap: "DEMO_NOT_FOR_PUBLICATION common trap.",
          memoryAid: "DEMO_NOT_FOR_PUBLICATION memory aid.",
          authorityNotes: ["DEMO_NOT_FOR_PUBLICATION authority note."],
          reviewChecklist: { legalAccuracy: false },
          importMetadata: { reviewerComments: "DEMO_NOT_FOR_PUBLICATION" },
        },
      ],
      seed: "stable-seed",
    });

    expect(assertSafeInitialPayload(getSafePracticeQuestion(session))).toEqual(
      [],
    );
  });

  it("scores exclusively from server-owned question data", () => {
    const session = demoSession("LEARNING");
    const sessionQuestion = session.questions[0]!;

    const result = submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: sessionQuestion.id,
      selectedChoiceIds: ["A"],
      responseTimeMs: 25_000,
      confidence: "HIGH",
      answerChanges: 1,
      idempotencyKey: "submit-1",
    });

    expect(result.attempt.isCorrect).toBe(true);
    expect(result.attempt.responseTimeMs).toBe(25_000);
    expect(result.attempt.answerChanges).toBe(1);
  });

  it("treats duplicate submissions idempotently", () => {
    const session = demoSession("LEARNING");
    const sessionQuestion = session.questions[0]!;
    const first = submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: sessionQuestion.id,
      selectedChoiceIds: ["A"],
      responseTimeMs: 25_000,
      idempotencyKey: "same-key",
      answerChanges: 0,
    });
    const second = submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: sessionQuestion.id,
      selectedChoiceIds: ["B"],
      responseTimeMs: 1,
      idempotencyKey: "same-key",
      answerChanges: 0,
    });

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.attempt.selectedChoiceIds).toEqual(["A"]);
    expect(session.attempts).toHaveLength(1);
  });

  it("keeps randomized choice order stable after refresh", () => {
    const session = demoSession("LEARNING");

    expect(
      getSafePracticeQuestion(session).choices.map((choice) => choice.id),
    ).toEqual(
      getSafePracticeQuestion(session).choices.map((choice) => choice.id),
    );
  });

  it("releases explanations only when the mode permits", () => {
    const learning = demoSession("LEARNING");
    const learningQuestion = learning.questions[0]!;
    submitPracticeAnswer({
      session: learning,
      userId: "dev-learner",
      sessionQuestionId: learningQuestion.id,
      selectedChoiceIds: ["A"],
      responseTimeMs: 10,
      idempotencyKey: "learning",
      answerChanges: 0,
    });

    expect(
      canRevealExplanation({
        session: learning,
        sessionQuestionId: learningQuestion.id,
      }),
    ).toBe(true);

    const exam = demoSession("EXAM");
    const examQuestion = exam.questions[0]!;
    submitPracticeAnswer({
      session: exam,
      userId: "dev-learner",
      sessionQuestionId: examQuestion.id,
      selectedChoiceIds: ["A"],
      responseTimeMs: 10,
      idempotencyKey: "exam",
      answerChanges: 0,
    });

    expect(
      canRevealExplanation({
        session: exam,
        sessionQuestionId: examQuestion.id,
      }),
    ).toBe(false);
  });

  it("summarizes incorrect and high-confidence review data", () => {
    const session = demoSession("EXAM");
    const first = session.questions[0]!;
    const second = session.questions[1]!;
    submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: first.id,
      selectedChoiceIds: ["B"],
      responseTimeMs: 20_000,
      confidence: "HIGH",
      idempotencyKey: "wrong",
      answerChanges: 1,
    });
    submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: second.id,
      selectedChoiceIds: ["B"],
      responseTimeMs: 10_000,
      confidence: "LOW",
      idempotencyKey: "right",
      answerChanges: 0,
    });

    const summary = buildPracticeReviewSummary(session);

    expect(summary.score).toBe(1);
    expect(summary.total).toBe(2);
    expect(summary.highConfidenceErrors).toHaveLength(1);
    expect(summary.changedAnswerCount).toBe(1);
    expect(summary.incorrectAttempts).toHaveLength(1);
  });

  it("filters custom and adaptive question sets", () => {
    const custom = selectPracticeQuestions({
      questions: demoQuestions,
      filters: normalizePracticeFilters({
        mode: "CUSTOM",
        subject: "Torts",
        questionCount: 5,
        timingMode: "UNTIMED",
        feedbackMode: "END_OF_SET",
      }),
    });
    const adaptive = selectPracticeQuestions({
      questions: demoQuestions,
      filters: normalizePracticeFilters({
        mode: "ADAPTIVE",
        questionCount: 2,
        topicPriority: ["mbe.category.torts.negligence"],
        timingMode: "UNTIMED",
        feedbackMode: "END_OF_SET",
      }),
    });

    expect(custom.every((question) => question.subject === "Torts")).toBe(true);
    expect(adaptive[0]?.primaryTopic).toBe("mbe.category.torts.negligence");
  });

  it("builds explanations only for post-submission review surfaces", () => {
    const explanation = buildQuestionExplanation(publishedQuestions[0]!);

    expect(explanation.correctAnswer).toBe("A");
    expect(explanation.choices[0]?.rationale).toContain(
      "DEMO_NOT_FOR_PUBLICATION",
    );
  });

  it("uses imported original explanations only after submission", () => {
    const explanation = buildQuestionExplanation({
      ...publishedLegacyQuestions[0]!,
      testedIssue: "DEMO_NOT_FOR_PUBLICATION imported tested issue.",
      governingRule: "DEMO_NOT_FOR_PUBLICATION imported rule.",
      application: "DEMO_NOT_FOR_PUBLICATION imported application.",
    });

    expect(explanation.testedIssue).toBe(
      "DEMO_NOT_FOR_PUBLICATION imported tested issue.",
    );
    expect(explanation.governingRule).toBe(
      "DEMO_NOT_FOR_PUBLICATION imported rule.",
    );
    expect(explanation.application).toBe(
      "DEMO_NOT_FOR_PUBLICATION imported application.",
    );
  });

  it("awards partial credit for select-two NextGen questions", () => {
    const question = publishedQuestions.find(
      (candidate) => candidate.format === "SELECT_TWO",
    )!;
    const session = createPracticeSession({
      id: "session-select-two",
      userId: "dev-learner",
      filters: normalizePracticeFilters({
        mode: "LEARNING",
        examTrack: "NEXTGEN_UBE",
        questionCount: 1,
        timingMode: "UNTIMED",
        feedbackMode: "IMMEDIATE",
      }),
      questions: [question],
      seed: "stable-seed",
    });

    const result = submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: session.questions[0]!.id,
      selectedChoiceIds: ["A", "C"],
      responseTimeMs: 30_000,
      idempotencyKey: "select-two",
      answerChanges: 0,
    });

    expect(result.attempt.earnedPoints).toBe(1);
    expect(result.attempt.maxPoints).toBe(2);
    expect(result.attempt.isCorrect).toBe(false);
  });

  it("supports safe split-screen NextGen written items", () => {
    const question = publishedQuestions.find(
      (candidate) => candidate.format === "INTEGRATED_SET",
    )!;
    const session = createPracticeSession({
      id: "session-integrated",
      userId: "dev-learner",
      filters: normalizePracticeFilters({
        mode: "LEARNING",
        examTrack: "NEXTGEN_UBE",
        questionCount: 1,
        timingMode: "TIMED",
        feedbackMode: "IMMEDIATE",
      }),
      questions: [question],
      seed: "stable-seed",
    });
    const safeQuestion = getSafePracticeQuestion(session);

    expect(safeQuestion.commonFactScenario).toContain(
      "DEMO_NOT_FOR_PUBLICATION",
    );
    expect(safeQuestion.responseAreas).toHaveLength(2);
    expect(assertSafeInitialPayload(safeQuestion)).toEqual([]);

    const result = submitPracticeAnswer({
      session,
      userId: "dev-learner",
      sessionQuestionId: session.questions[0]!.id,
      selectedChoiceIds: [],
      writtenResponses: {
        short: "DEMO_NOT_FOR_PUBLICATION short response",
        medium: "DEMO_NOT_FOR_PUBLICATION medium response",
      },
      responseTimeMs: 120_000,
      idempotencyKey: "integrated",
      answerChanges: 0,
    });

    expect(result.attempt.earnedPoints).toBe(2);
    expect(result.attempt.scoreScale).toBe("NEXTGEN_POINTS");
  });
});

function demoSession(mode: "LEARNING" | "EXAM") {
  return createPracticeSession({
    id: `session-${mode}`,
    userId: "dev-learner",
    filters: normalizePracticeFilters({
      mode,
      questionCount: 2,
      timingMode: mode === "EXAM" ? "TIMED" : "UNTIMED",
      feedbackMode: mode === "LEARNING" ? "IMMEDIATE" : "END_OF_SET",
    }),
    questions: publishedLegacyQuestions,
    seed: "stable-seed",
    startedAt: new Date("2026-06-24T00:00:00.000Z"),
  });
}
