import { describe, expect, it } from "vitest";

import { demoEssays } from "./demo-admin-content";
import {
  assertSafeEssayWorkspace,
  autosaveEssayDraft,
  buildEssayReviewMaterial,
  calculateAccommodatedMinutes,
  chooseRecoveredEssayDraft,
  createEssayMasteryArtifacts,
  createSafeEssayWorkspace,
  scoreEssaySelfAssessment,
  submitEssayAttempt,
} from "./essay-engine";
import type { EssayAttemptState } from "./essay-types";

const essay = demoEssays[0]!;

describe("essay engine", () => {
  it("builds pre-submission payloads without sample answers or rubrics", () => {
    const workspace = createSafeEssayWorkspace({
      essay,
      attempt: demoAttempt(),
    });

    expect(assertSafeEssayWorkspace(workspace)).toEqual([]);
    expect(JSON.stringify(workspace)).not.toContain("sampleAnswer");
    expect(JSON.stringify(workspace)).not.toContain("rubricItems");
    expect(JSON.stringify(workspace)).not.toContain("maxPoints");
    expect(JSON.stringify(workspace)).not.toContain("ruleStatement");
  });

  it("autosaves server drafts and tracks word count", () => {
    const attempt = demoAttempt();
    const autosave = autosaveEssayDraft({
      attempt,
      outline: "DEMO_NOT_FOR_PUBLICATION outline",
      answer: "DEMO_NOT_FOR_PUBLICATION answer text",
      clientSavedAt: new Date("2026-06-24T10:00:00.000Z"),
      savedAt: new Date("2026-06-24T10:01:00.000Z"),
    });

    expect(autosave.wordCount).toBe(3);
    expect(attempt.autosaves).toHaveLength(1);
    expect(attempt.answer).toContain("DEMO_NOT_FOR_PUBLICATION");
  });

  it("recovers the newer local or server draft", () => {
    const server = {
      outline: "server",
      answer: "server",
      savedAt: new Date("2026-06-24T10:00:00.000Z"),
    };
    const local = {
      outline: "local",
      answer: "local",
      savedAt: new Date("2026-06-24T10:05:00.000Z"),
    };

    expect(chooseRecoveredEssayDraft({ server, local })).toBe(local);
    expect(chooseRecoveredEssayDraft({ server })).toBe(server);
  });

  it("applies extended-time accommodation within the configured range", () => {
    expect(
      calculateAccommodatedMinutes({
        baseMinutes: 30,
        extendedTimeMultiplier: 1.5,
      }),
    ).toBe(45);
    expect(() =>
      calculateAccommodatedMinutes({
        baseMinutes: 30,
        extendedTimeMultiplier: 4,
      }),
    ).toThrow(/outside/);
  });

  it("submits essays idempotently", () => {
    const attempt = demoAttempt();
    const first = submitEssayAttempt({
      attempt,
      outline: "outline",
      answer: "first answer",
      idempotencyKey: "same-key",
      submittedAt: new Date("2026-06-24T11:00:00.000Z"),
    });
    const second = submitEssayAttempt({
      attempt,
      outline: "outline changed",
      answer: "changed answer",
      idempotencyKey: "same-key",
      submittedAt: new Date("2026-06-24T11:01:00.000Z"),
    });

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(attempt.answer).toBe("first answer");
  });

  it("releases review material only after submission", () => {
    expect(() =>
      buildEssayReviewMaterial({ essay, attempt: demoAttempt() }),
    ).toThrow(/after submission/);

    const attempt = submittedAttempt();
    const review = buildEssayReviewMaterial({ essay, attempt });

    expect(review.sampleAnswer).toContain("DEMO_NOT_FOR_PUBLICATION");
    expect(review.issueChecklist[0]?.maxPoints).toBeGreaterThan(0);
  });

  it("scores rubric self-assessment and preserves rubric version", () => {
    const attempt = submittedAttempt();
    const assessment = scoreEssaySelfAssessment({
      essay,
      attempt,
      missedRubricItemIds: [essay.rubricItems[0]!.id],
      submittedAt: new Date("2026-06-24T12:00:00.000Z"),
    });

    expect(assessment.rubricVersion).toBe(essay.version);
    expect(assessment.totalPoints).toBe(5);
    expect(assessment.earnedPoints).toBe(3);
    expect(attempt.status).toBe("REVIEWED");
  });

  it("creates weighted mastery events and review items for missed issues", () => {
    const attempt = submittedAttempt();
    const assessment = scoreEssaySelfAssessment({
      essay,
      attempt,
      missedRubricItemIds: [essay.rubricItems[0]!.id],
      submittedAt: new Date("2026-06-24T12:00:00.000Z"),
    });
    const artifacts = createEssayMasteryArtifacts({
      userId: "dev-learner",
      essay,
      attempt,
      assessment,
    });

    expect(artifacts.events).toHaveLength(2);
    expect(artifacts.events[0]?.eventWeight).toBe(0.6);
    expect(artifacts.reviewItems).toHaveLength(1);
    expect(artifacts.reviewItems[0]?.source).toBe("ESSAY_RUBRIC_MISS");
  });
});

function demoAttempt(): EssayAttemptState {
  return {
    id: "essay-attempt-test",
    userId: "dev-learner",
    essayVersionId: essay.id,
    status: "IN_PROGRESS",
    responseMode: "FULL_ANSWER",
    timerMinutes: 30,
    extendedTimeMultiplier: 1,
    outline: "",
    answer: "",
    wordCount: 0,
    startedAt: new Date("2026-06-24T09:00:00.000Z"),
    autosaves: [],
    notes: [],
    dataClassification: "DEMO_NOT_FOR_PUBLICATION",
  };
}

function submittedAttempt() {
  const attempt = demoAttempt();
  submitEssayAttempt({
    attempt,
    outline: "DEMO_NOT_FOR_PUBLICATION outline",
    answer: "DEMO_NOT_FOR_PUBLICATION submitted answer",
    idempotencyKey: "submitted",
    submittedAt: new Date("2026-06-24T11:00:00.000Z"),
  });
  return attempt;
}
