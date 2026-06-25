import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ORIGINAL_QUESTION_AUDITED_PROVENANCE,
  ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
  ORIGINAL_QUESTION_PROVENANCE,
  OriginalQuestionImportValidationError,
  buildOriginalQuestionTaxonomyReport,
  canPublishOriginalQuestionVersion,
  getOriginalQuestionBatchProfile,
  isOriginalQuestionProvenance,
  normalizeOriginalQuestionBatch,
  parseOriginalQuestionBatchJson,
  resolveOriginalQuestionVersionWrite,
  validateOriginalQuestionTaxonomy,
  type OriginalQuestionBatch,
  type OriginalQuestionDraft,
} from "./original-question-import";
import type { DemoQuestionVersion } from "./admin-content-types";
import {
  assertSafeInitialPayload,
  createPracticeSession,
  getSafePracticeQuestion,
  normalizePracticeFilters,
  selectPracticeQuestions,
} from "./practice-engine";
import { MBE_CATEGORIES_BY_SUBJECT, MBE_SUBJECTS } from "./seed-data";

describe("original MBE question batch import validation", () => {
  it("accepts the supplied original batch without publishing it", () => {
    const content = readFileSync(
      "data/import/mbe_original_question_bank_batch_001.json",
      "utf8",
    );
    const result = normalizeOriginalQuestionBatch(
      parseOriginalQuestionBatchJson(content),
    );

    expect(result.questions).toHaveLength(21);
    expect(result.questions.every((question) => !question.publishable)).toBe(
      true,
    );
    expect(
      result.questions.every((question) => question.status === "LEGAL_REVIEW"),
    ).toBe(true);
    expect(result.report.answerKeyDistribution).toEqual({
      A: 5,
      B: 6,
      C: 5,
      D: 5,
    });
    expect(result.report.provenanceDistribution).toEqual({
      [ORIGINAL_QUESTION_PROVENANCE]: 21,
    });
  });

  it("accepts the supplied Batch 002 shape without making it publishable", () => {
    const result = suppliedBatch002();

    expect(result.questions).toHaveLength(70);
    expect(result.questions.every((question) => !question.publishable)).toBe(
      true,
    );
    expect(
      result.questions.every((question) => question.status === "LEGAL_REVIEW"),
    ).toBe(true);
    expect(result.report.questionsPerSubject).toEqual(
      Object.fromEntries(MBE_SUBJECTS.map((subject) => [subject, 10])),
    );
    expect(result.report.answerKeyDistribution).toEqual({
      A: 18,
      B: 18,
      C: 17,
      D: 17,
    });
    expect(result.report.provenanceDistribution).toEqual({
      [ORIGINAL_QUESTION_PROVENANCE]: 70,
    });
  });

  it("accepts audited Batch 003 while preserving legal-review status and provenance", () => {
    const result = suppliedBatch003();

    expect(result.questions).toHaveLength(35);
    expect(result.questions.every((question) => !question.publishable)).toBe(
      true,
    );
    expect(
      result.questions.every((question) => question.status === "LEGAL_REVIEW"),
    ).toBe(true);
    expect(result.report.questionsPerSubject).toEqual(
      Object.fromEntries(MBE_SUBJECTS.map((subject) => [subject, 5])),
    );
    expect(result.report.answerKeyDistribution).toEqual({
      A: 9,
      B: 9,
      C: 9,
      D: 8,
    });
    expect(result.report.provenanceDistribution).toEqual({
      [ORIGINAL_QUESTION_AUDITED_PROVENANCE]: 35,
    });
  });

  it("preserves Batch 003 audit metadata for database import metadata", () => {
    const result = suppliedBatch003();
    const first = result.questions[0]!;

    expect(first.authoring.sourceType).toBe(
      ORIGINAL_QUESTION_AUDITED_PROVENANCE,
    );
    expect(first.authoring.publishable).toBe(false);
    expect(first.qualityAudit?.status).toBe(
      "INTERNAL_SECOND_PASS_PASS_PENDING_ATTORNEY_REVIEW",
    );
    expect(first.qualityAudit?.residualRisk).toMatch(/LOW|MODERATE/);
    expect(first.qualityAudit?.checks.officialSampleTextCopied).toBe(false);
    expect(first.qualityAudit?.checks.priorBatchQuestionDuplicated).toBe(false);
  });

  it("rejects Batch 003 validation failures before persistence", () => {
    const batch = suppliedBatch003Raw();
    batch.questions[0]!.authoring.publishable = true;
    batch.questions[1]!.qualityAudit!.checks.officialSampleTextCopied = true;
    batch.questions[2]!.choices = batch.questions[2]!.choices.slice(0, 3);

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /marked official or publishable/,
    );
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /did not pass required audit checks/,
    );
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /exactly four choices/,
    );
  });

  it("maps Batch 003 taxonomy to existing subjects and categories before creating subtopics", () => {
    const normalized = suppliedBatch003();
    const available = new Set(
      normalized.questions.flatMap((question) => [
        question.subjectKey,
        question.categoryKey,
      ]),
    );
    const report = buildOriginalQuestionTaxonomyReport({
      questions: normalized.questions,
      availableTaxonomyKeys: available,
    });

    expect(
      getOriginalQuestionBatchProfile(normalized.batch.batchId),
    ).toMatchObject({
      allowCreateSubtopics: true,
      expectedBatchSize: 35,
    });
    expect(report.missingRequiredNodes).toEqual([]);
    expect(report.missingSubtopicNodes).toHaveLength(35);
    expect(() =>
      validateOriginalQuestionTaxonomy({
        questions: normalized.questions,
        availableTaxonomyKeys: available,
        allowCreateSubtopics: true,
      }),
    ).not.toThrow();
  });

  it("uses idempotent version writes for repeated Batch 003 imports", () => {
    const result = resolveOriginalQuestionVersionWrite({
      batchId: "original-legacy-mbe-style-batch-003-audited",
      existingVersions: [
        {
          batchId: "original-legacy-mbe-style-batch-003-audited",
          status: "LEGAL_REVIEW",
          version: 1,
        },
      ],
    });

    expect(result.action).toBe("updated");
    expect(result.versionNumber).toBe(1);

    const nextVersion = resolveOriginalQuestionVersionWrite({
      batchId: "original-legacy-mbe-style-batch-003-audited",
      existingVersions: [
        {
          batchId: "original-legacy-mbe-style-batch-003-audited",
          status: "PUBLISHED",
          version: 1,
        },
      ],
    });

    expect(nextVersion.action).toBe("created");
    expect(nextVersion.versionNumber).toBe(2);
  });

  it("keeps Batch 003 answer-key material out of pre-submission practice payloads", () => {
    const [question] = suppliedBatch003().questions;
    const practiceQuestion = toDemoQuestion(question!);
    const session = createPracticeSession({
      id: "batch-003-security-session",
      userId: "student",
      filters: normalizePracticeFilters({
        mode: "LEARNING",
        questionCount: 1,
      }),
      questions: [practiceQuestion],
      seed: "batch-003-security",
    });
    const safeQuestion = getSafePracticeQuestion(session);

    expect(assertSafeInitialPayload(safeQuestion)).toEqual([]);
    expect(JSON.stringify(safeQuestion)).not.toContain("isCorrect");
    expect(JSON.stringify(safeQuestion)).not.toContain("rationale");
    expect(JSON.stringify(safeQuestion)).not.toContain("governingRule");
  });

  it("is admin-discoverable by provenance but excluded from student practice while unpublished", () => {
    const [question] = suppliedBatch003().questions;
    const practiceQuestion = toDemoQuestion(question!);

    expect(isOriginalQuestionProvenance(practiceQuestion.provenance)).toBe(
      true,
    );
    expect(practiceQuestion.status).toBe("LEGAL_REVIEW");
    expect(
      selectPracticeQuestions({
        questions: [practiceQuestion],
        filters: normalizePracticeFilters({
          mode: "LEARNING",
          questionCount: 1,
        }),
      }),
    ).toEqual([]);
  });

  it("uses the strict Batch 002 taxonomy profile instead of silently creating subtopics", () => {
    const normalized = suppliedBatch002();
    const profile = getOriginalQuestionBatchProfile(normalized.batch.batchId);
    const available = new Set(
      normalized.questions.flatMap((question) => [
        question.subjectKey,
        question.categoryKey,
      ]),
    );
    const report = buildOriginalQuestionTaxonomyReport({
      questions: normalized.questions,
      availableTaxonomyKeys: available,
    });

    expect(profile.allowCreateSubtopics).toBe(false);
    expect(report.missingRequiredNodes).toEqual([]);
    expect(report.missingSubtopicNodes).toHaveLength(70);
    expect(() =>
      validateOriginalQuestionTaxonomy({
        questions: normalized.questions,
        availableTaxonomyKeys: available,
        allowCreateSubtopics: profile.allowCreateSubtopics,
      }),
    ).toThrow(/Taxonomy node missing/);
  });

  it("rejects Batch 002 answer-distribution drift", () => {
    const batch = suppliedBatch002Raw();
    batch.questions[0]!.correctChoice = "A";

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /answer distribution/,
    );
  });

  it("rejects correct choices with distractor classifications", () => {
    const batch = suppliedBatch002Raw();
    const correctChoice = batch.questions[0]!.choices.find(
      (choice) => choice.isCorrect,
    );

    if (correctChoice) {
      correctChoice.distractorType = "DEMO_NOT_FOR_PUBLICATION";
    }

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /must not have a distractor type/,
    );
  });

  it("rejects missing Batch 002 explanation fields required for review", () => {
    const batch = suppliedBatch002Raw();
    batch.questions[0]!.explanation.commonTrap = "";
    batch.questions[1]!.explanation.memoryAid = "";

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(/commonTrap/);
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(/memoryAid/);
  });

  it("rejects duplicate stable keys", () => {
    const batch = demoBatch();
    batch.questions[1]!.key = batch.questions[0]!.key;

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      OriginalQuestionImportValidationError,
    );
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /Duplicate question key/,
    );
  });

  it("rejects malformed choice and rationale data", () => {
    const batch = demoBatch();
    batch.questions[0]!.choices = batch.questions[0]!.choices.slice(0, 3);
    batch.questions[1]!.choices[1]!.rationale = "";
    batch.questions[2]!.choices[1]!.distractorType = null;

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /exactly four choices/,
    );
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(/rationale/);
    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /distractor type/,
    );
  });

  it("rejects one-correct-answer mismatches", () => {
    const batch = demoBatch();
    batch.questions[0]!.correctChoice = "B";

    expect(() => normalizeOriginalQuestionBatch(batch)).toThrow(
      /correctChoice disagrees/,
    );
  });

  it("rejects missing taxonomy when creation is not allowed", () => {
    const normalized = normalizeOriginalQuestionBatch(demoBatch());
    const available = new Set(
      normalized.questions.flatMap((question) => [
        question.subjectKey,
        question.categoryKey,
      ]),
    );

    expect(() =>
      validateOriginalQuestionTaxonomy({
        questions: normalized.questions,
        availableTaxonomyKeys: available,
        allowCreateSubtopics: false,
      }),
    ).toThrow(/Taxonomy node missing/);
  });

  it("accepts subject and category taxonomy before subtopic creation", () => {
    const normalized = normalizeOriginalQuestionBatch(demoBatch());
    const available = new Set(
      normalized.questions.flatMap((question) => [
        question.subjectKey,
        question.categoryKey,
      ]),
    );

    expect(() =>
      validateOriginalQuestionTaxonomy({
        questions: normalized.questions,
        availableTaxonomyKeys: available,
        allowCreateSubtopics: true,
      }),
    ).not.toThrow();
  });

  it("blocks publication before independent legal and editorial approvals", () => {
    expect(
      canPublishOriginalQuestionVersion({
        actor: { id: "admin", roles: ["ADMIN"] },
        status: "LEGAL_REVIEW",
        publishable: false,
        authorId: "importer",
        twoPersonReview: true,
      }),
    ).toBe(false);

    expect(
      canPublishOriginalQuestionVersion({
        actor: { id: "admin", roles: ["ADMIN"] },
        status: "APPROVED",
        publishable: true,
        authorId: "importer",
        legalReviewerId: "importer",
        editorialReviewerId: "editor",
        twoPersonReview: true,
      }),
    ).toBe(false);

    expect(
      canPublishOriginalQuestionVersion({
        actor: { id: "admin", roles: ["ADMIN"] },
        status: "APPROVED",
        publishable: true,
        authorId: "importer",
        legalReviewerId: "reviewer",
        editorialReviewerId: "editor",
        twoPersonReview: true,
      }),
    ).toBe(true);
  });
});

function suppliedBatch002() {
  return normalizeOriginalQuestionBatch(suppliedBatch002Raw());
}

function suppliedBatch002Raw() {
  const content = readFileSync(
    "data/import/mbe_original_question_bank_batch_002.json",
    "utf8",
  );

  return parseOriginalQuestionBatchJson(content);
}

function suppliedBatch003() {
  return normalizeOriginalQuestionBatch(suppliedBatch003Raw());
}

function suppliedBatch003Raw() {
  const content = readFileSync(
    "data/import/mbe_original_question_bank_batch_003_audited.json",
    "utf8",
  );

  return parseOriginalQuestionBatchJson(content);
}

function toDemoQuestion(
  question: ReturnType<typeof suppliedBatch003>["questions"][number],
): DemoQuestionVersion {
  return {
    id: question.key,
    subject: question.subject,
    category: question.category,
    examTrack: question.examTrack,
    format: question.format,
    stem: question.stem,
    callOfQuestion: question.callOfQuestion,
    choices: question.choices.map((choice) => ({
      label: choice.label,
      text: choice.text,
      isCorrect: choice.isCorrect,
      rationale: choice.rationale,
      distractorType: choice.dbDistractorType,
    })),
    primaryTopic: question.subtopicKey,
    secondaryTopics: [question.categoryKey],
    difficulty: question.difficulty,
    estimatedSeconds: question.estimatedSeconds,
    licenseKey: question.licenseKey,
    sourceKey: question.batchId,
    authorId: "demo-importer",
    batchId: question.batchId,
    provenance: question.sourceType,
    publicSourceLabel: question.publicSourceLabel,
    publishable: question.publishable,
    testedIssue: question.explanation.testedIssue,
    governingRule: question.explanation.governingRule,
    application: question.explanation.application,
    commonTrap: question.explanation.commonTrap,
    memoryAid: question.explanation.memoryAid,
    authorityNotes: question.authorityNotes,
    reviewChecklist: question.reviewChecklist,
    importMetadata: {
      authoring: question.authoring,
      qualityAudit: question.qualityAudit,
    },
    effectiveFrom: new Date("2026-06-24T00:00:00.000Z"),
    status: question.status,
    version: 1,
    dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
  };
}

function demoBatch(): OriginalQuestionBatch {
  const questions: OriginalQuestionDraft[] = MBE_SUBJECTS.flatMap((subject) =>
    MBE_CATEGORIES_BY_SUBJECT[subject].slice(0, 3).map((category, index) => {
      const key = `demo-${subject.toLowerCase().replaceAll(/\W+/g, "-")}-${index}`;
      const subtopic = `DEMO_NOT_FOR_PUBLICATION ${category} subtopic`;

      return {
        key,
        examTrack: "LEGACY_UBE",
        questionType: "SINGLE_SELECT",
        subject,
        category,
        subtopic,
        difficulty: "MEDIUM",
        estimatedSeconds: 100,
        stem: "DEMO_NOT_FOR_PUBLICATION stem.",
        call: "DEMO_NOT_FOR_PUBLICATION call.",
        choices: [
          choice("A", true),
          choice("B", false),
          choice("C", false),
          choice("D", false),
        ],
        correctChoice: "A",
        explanation: {
          testedIssue: "DEMO_NOT_FOR_PUBLICATION tested issue.",
          governingRule: "DEMO_NOT_FOR_PUBLICATION governing rule.",
          application: "DEMO_NOT_FOR_PUBLICATION application.",
          commonTrap: "DEMO_NOT_FOR_PUBLICATION common trap.",
          memoryAid: "DEMO_NOT_FOR_PUBLICATION memory aid.",
        },
        authorityNotes: ["DEMO_NOT_FOR_PUBLICATION authority note."],
        authoring: {
          status: "LEGAL_REVIEW",
          sourceType: "ORIGINAL_AI_ASSISTED_DRAFT",
          officialQuestion: false,
          publishable: false,
          requiresAttorneyApproval: true,
          licenseKey: "original-internal-draft",
          contentWarning: "DEMO_NOT_FOR_PUBLICATION review warning.",
        },
      };
    }),
  );

  return {
    schemaVersion: "1.0",
    batchId: "demo-original-batch",
    title: "DEMO_NOT_FOR_PUBLICATION original batch",
    description: "DEMO_NOT_FOR_PUBLICATION description.",
    rights: {
      sourceType: "ORIGINAL_AI_ASSISTED_DRAFT",
      copyrightOwner: "DEMO_NOT_FOR_PUBLICATION owner",
      officialNCBEContentIncluded: false,
      ncbePermissionRequiredForUploadedSamples: true,
      publicReleaseAllowed: false,
      requiredReview: ["SUBJECT_MATTER_ATTORNEY", "EDITORIAL_REVIEWER"],
      marketingRestriction: "DEMO_NOT_FOR_PUBLICATION marketing restriction.",
    },
    formatProfile: {
      examTrack: "LEGACY_UBE",
      questionType: "SINGLE_SELECT",
      choicesPerQuestion: 4,
      correctChoicesPerQuestion: 1,
      targetSeconds: 100,
    },
    questions,
    answerDistribution: { A: 21 },
  };
}

function choice(label: string, isCorrect: boolean) {
  return {
    label,
    text: `DEMO_NOT_FOR_PUBLICATION choice ${label}.`,
    isCorrect,
    rationale: `DEMO_NOT_FOR_PUBLICATION rationale ${label}.`,
    distractorType: isCorrect ? null : "WRONG_RULE",
  };
}
