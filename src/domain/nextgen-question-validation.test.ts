import { describe, expect, it } from "vitest";

import { demoQuestions } from "./demo-admin-content";
import { validateQuestionVersion } from "./question-validation";

describe("NextGen question validation", () => {
  it("accepts demonstration fixtures for every requested NextGen item type", () => {
    const nextGenFormats = new Set(
      demoQuestions
        .filter((question) => question.examTrack === "NEXTGEN_UBE")
        .map((question) => question.format),
    );

    expect(nextGenFormats).toEqual(
      new Set([
        "SELECT_TWO",
        "SHORT_ANSWER",
        "MEDIUM_ANSWER",
        "INTEGRATED_SET",
        "STANDARD_PERFORMANCE_TASK",
        "LEGAL_RESEARCH_PERFORMANCE_TASK",
      ]),
    );

    for (const question of demoQuestions.filter(
      (candidate) => candidate.examTrack === "NEXTGEN_UBE",
    )) {
      expect(
        validateQuestionVersion({
          ...question,
          status: "PUBLISHED",
        }),
      ).toEqual([]);
    }
  });

  it("rejects select-two, integrated-set, and performance-task shape errors", () => {
    const selectTwo = demoQuestions.find(
      (question) => question.format === "SELECT_TWO",
    )!;
    const integrated = demoQuestions.find(
      (question) => question.format === "INTEGRATED_SET",
    )!;
    const performance = demoQuestions.find(
      (question) => question.format === "STANDARD_PERFORMANCE_TASK",
    )!;

    expect(
      validateQuestionVersion({
        ...selectTwo,
        choices: selectTwo.choices.map((choice, index) => ({
          ...choice,
          isCorrect: index === 0,
        })),
      }),
    ).toContain("A select-two question must have exactly two correct answers.");

    expect(
      validateQuestionVersion({
        ...integrated,
        commonFactScenario: "",
      }),
    ).toContain(
      "Integrated-set questions require a shared set id and common fact scenario.",
    );

    expect(
      validateQuestionVersion({
        ...performance,
        performanceTaskLibrary: [],
      }),
    ).toContain("Performance tasks require a file or library attachment.");
  });
});
