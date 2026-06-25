import type { DemoQuestionVersion } from "./admin-content-types";

export function validateQuestionVersion(question: DemoQuestionVersion) {
  const errors: string[] = [];

  if (question.dataClassification !== "DEMO_NOT_FOR_PUBLICATION") {
    errors.push("Question fixtures must be labeled DEMO_NOT_FOR_PUBLICATION.");
  }

  if (!question.stem.trim()) {
    errors.push("Stem is required.");
  }

  if (!question.callOfQuestion.trim()) {
    errors.push("Call of the question is required.");
  }

  if (!question.primaryTopic.trim()) {
    errors.push("Primary topic is required.");
  }

  if (!question.licenseKey.trim()) {
    errors.push("License is required.");
  }

  if (question.effectiveTo && question.effectiveTo < question.effectiveFrom) {
    errors.push("Effective dates are inconsistent.");
  }

  const correctChoices = question.choices.filter((choice) => choice.isCorrect);

  if (question.format === "SINGLE_SELECT" && correctChoices.length !== 1) {
    errors.push(
      "A single-select question must have exactly one correct answer.",
    );
  }

  if (question.format === "SELECT_TWO" && correctChoices.length !== 2) {
    errors.push("A select-two question must have exactly two correct answers.");
  }

  if (question.format === "MULTI_SELECT" && correctChoices.length < 1) {
    errors.push(
      "A multi-select question must have at least one correct answer.",
    );
  }

  if (isWrittenFormat(question.format) && !question.scoringRubric) {
    errors.push(
      "Written NextGen questions require a versioned scoring rubric.",
    );
  }

  if (
    question.format === "INTEGRATED_SET" &&
    (!question.integratedSetId || !question.commonFactScenario)
  ) {
    errors.push(
      "Integrated-set questions require a shared set id and common fact scenario.",
    );
  }

  if (
    (question.format === "STANDARD_PERFORMANCE_TASK" ||
      question.format === "LEGAL_RESEARCH_PERFORMANCE_TASK") &&
    (question.performanceTaskLibrary ?? []).length === 0
  ) {
    errors.push("Performance tasks require a file or library attachment.");
  }

  if (
    question.examTrack === "NEXTGEN_UBE" &&
    !question.lawyeringSkillTopic?.trim()
  ) {
    errors.push("NextGen questions require a lawyering-skill taxonomy topic.");
  }

  for (const choice of question.choices) {
    if (!choice.rationale.trim()) {
      errors.push(`Choice ${choice.label} requires a rationale.`);
    }

    if (!choice.isCorrect && choice.distractorType === "NONE") {
      errors.push(
        `Incorrect choice ${choice.label} requires a distractor type.`,
      );
    }
  }

  return errors;
}

function isWrittenFormat(format: DemoQuestionVersion["format"]) {
  return [
    "SHORT_ANSWER",
    "MEDIUM_ANSWER",
    "INTEGRATED_SET",
    "STANDARD_PERFORMANCE_TASK",
    "LEGAL_RESEARCH_PERFORMANCE_TASK",
  ].includes(format);
}
