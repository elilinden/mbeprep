import type {
  ContentActor,
  ContentWorkflowStatus,
  DistractorType,
  ExamTrackCode,
  QuestionDifficulty,
  QuestionFormat,
} from "./admin-content-types";
import { canTransitionContent } from "./content-workflow";
import {
  MBE_CATEGORIES_BY_SUBJECT,
  MBE_SUBJECTS,
  slugifyLabel,
} from "./seed-data";

export const ORIGINAL_QUESTION_BATCH_CLASSIFICATION =
  "DEMO_NOT_FOR_PUBLICATION";
export const ORIGINAL_QUESTION_PROVENANCE = "ORIGINAL_AI_ASSISTED_DRAFT";
export const ORIGINAL_QUESTION_AUDITED_PROVENANCE =
  "ORIGINAL_AI_ASSISTED_DRAFT_WITH_INTERNAL_SECOND_PASS";
export const ORIGINAL_QUESTION_PROVENANCES = [
  ORIGINAL_QUESTION_PROVENANCE,
  ORIGINAL_QUESTION_AUDITED_PROVENANCE,
] as const;
export const ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL =
  "Original practice question";
export const ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY = "original-internal-draft";
export const ORIGINAL_QUESTION_IMPORT_STATUS: ContentWorkflowStatus =
  "LEGAL_REVIEW";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
const DEFAULT_ESTIMATED_SECONDS = { min: 60, max: 180 };

type OriginalQuestionBatchProfile = {
  expectedBatchSize: number;
  expectedPerSubject: number;
  expectedAnswerDistribution?: Record<string, number>;
  allowCreateSubtopics: boolean;
};

const DEFAULT_BATCH_PROFILE: OriginalQuestionBatchProfile = {
  expectedBatchSize: 21,
  expectedPerSubject: 3,
  allowCreateSubtopics: true,
};

const ORIGINAL_QUESTION_BATCH_PROFILES: Record<
  string,
  OriginalQuestionBatchProfile
> = {
  "original-legacy-mbe-style-batch-001": {
    expectedBatchSize: 21,
    expectedPerSubject: 3,
    expectedAnswerDistribution: { A: 5, B: 6, C: 5, D: 5 },
    allowCreateSubtopics: true,
  },
  "original-legacy-mbe-style-batch-002": {
    expectedBatchSize: 70,
    expectedPerSubject: 10,
    expectedAnswerDistribution: { A: 18, B: 18, C: 17, D: 17 },
    allowCreateSubtopics: false,
  },
  "original-legacy-mbe-style-batch-003-audited": {
    expectedBatchSize: 35,
    expectedPerSubject: 5,
    expectedAnswerDistribution: { A: 9, B: 9, C: 9, D: 8 },
    allowCreateSubtopics: true,
  },
};

const canonicalCategoryAliases: Record<string, string> = {
  "Constitutional Law::The relation of nation and states in a federal system":
    "Federalism",
  "Constitutional Law::The nature of judicial review": "Judicial review",
  "Constitutional Law::The separation of powers": "Separation of powers",
  "Contracts::Formation of contracts": "Formation",
  "Criminal Law and Procedure::Inchoate crimes; parties": "Inchoate offenses",
  "Criminal Law and Procedure::Constitutional protection of accused persons":
    "Constitutional protections for accused persons",
  "Criminal Law and Procedure::General principles": "Defenses",
  "Civil Procedure::Appealability and review":
    "Verdicts, judgments, and appeals",
  "Civil Procedure::Verdicts and judgments": "Verdicts, judgments, and appeals",
  "Evidence::Relevancy and reasons for excluding relevant evidence":
    "Relevance and exclusion",
  "Evidence::Hearsay and circumstances of its admissibility":
    "Presentation of evidence",
  "Evidence::Privileges and other policy exclusions": "Privileges",
  "Real Property::Mortgages/security devices": "Mortgages and security devices",
  "Real Property::Ownership of real property": "Ownership",
  "Real Property::Rights in real property": "Rights in land",
  "Torts::Strict liability and products liability": "Products liability",
};

export class OriginalQuestionImportValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Original question import validation failed: ${errors.join("; ")}`);
    this.name = "OriginalQuestionImportValidationError";
  }
}

export type OriginalQuestionProvenance =
  (typeof ORIGINAL_QUESTION_PROVENANCES)[number];

export type OriginalQuestionBatch = {
  schemaVersion: string;
  batchId: string;
  title: string;
  description: string;
  relatedPriorBatches?: string[];
  rights: {
    sourceType: string;
    copyrightOwner: string;
    officialNCBEContentIncluded: boolean;
    ncbePermissionRequiredForUploadedSamples?: boolean;
    officialSampleUsedOnlyForGeneralFormatStudy?: boolean;
    publicReleaseAllowed: boolean;
    requiredReview: string[];
    marketingRestriction: string;
  };
  formatProfile: {
    examTrack: ExamTrackCode;
    questionType: QuestionFormat;
    choicesPerQuestion: number;
    correctChoicesPerQuestion: number;
    targetSeconds: number;
    targetPromptWords?: unknown;
    targetChoiceWords?: unknown;
    styleNotes?: string[];
  };
  researchBasis?: unknown;
  internalAudit?: {
    status?: string;
    auditVersion?: string;
    questionsAudited?: number;
    structuredChecksPassed?: string[];
    answerDistribution?: Record<string, number>;
    subjectDistribution?: Record<string, number>;
    residualRiskDistribution?: Record<string, number>;
    styleMetrics?: unknown;
    limitations?: string[];
  };
  coveragePlan?: Record<string, unknown>;
  questions: OriginalQuestionDraft[];
  answerDistribution: Record<string, number>;
};

export type OriginalQuestionDraft = {
  key: string;
  examTrack: ExamTrackCode;
  questionType: QuestionFormat;
  subject: string;
  category: string;
  subtopic: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  stem: string;
  call: string;
  choices: OriginalChoiceDraft[];
  correctChoice: string;
  explanation: {
    testedIssue: string;
    governingRule: string;
    application: string;
    commonTrap: string;
    memoryAid: string;
  };
  authorityNotes: string[];
  authoring: {
    status: ContentWorkflowStatus;
    sourceType: string;
    officialQuestion: boolean;
    publishable: boolean;
    requiresAttorneyApproval: boolean;
    licenseKey: string;
    contentWarning: string;
  };
  qualityAudit?: OriginalQuestionQualityAudit;
};

export type OriginalQuestionQualityAudit = {
  auditVersion: string;
  status: string;
  checks: {
    oneBestAnswerInternallyConfirmed: boolean;
    ruleAndApplicationInternallyChecked: boolean;
    factsSufficientForKeyedAnswer: boolean;
    distractorsPlausibleAndMutuallyExclusive: boolean;
    optionsGrammaticallyParallel: boolean;
    officialSampleTextCopied: boolean;
    priorBatchQuestionDuplicated: boolean;
  };
  residualRisk: "LOW" | "MODERATE" | "HIGH";
  secondPassNotes: string;
  computedMetrics: Record<string, unknown>;
};

export type OriginalChoiceDraft = {
  label: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
  distractorType: string | null;
};

export type NormalizedOriginalQuestion = {
  key: string;
  batchId: string;
  examTrack: ExamTrackCode;
  format: QuestionFormat;
  subject: string;
  category: string;
  originalCategory: string;
  subtopic: string;
  subjectKey: string;
  categoryKey: string;
  subtopicKey: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  stem: string;
  callOfQuestion: string;
  choices: Array<
    OriginalChoiceDraft & {
      dbDistractorType: DistractorType;
      originalDistractorType: string | null;
      sortOrder: number;
    }
  >;
  correctChoice: string;
  explanation: OriginalQuestionDraft["explanation"];
  authorityNotes: string[];
  status: ContentWorkflowStatus;
  sourceType: OriginalQuestionProvenance;
  publicSourceLabel: typeof ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL;
  publishable: false;
  licenseKey: typeof ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY;
  reviewChecklist: ReviewChecklist;
  authoring: OriginalQuestionDraft["authoring"];
  qualityAudit?: OriginalQuestionQualityAudit;
};

export type ReviewChecklist = {
  legalAccuracy: false;
  oneBestAnswer: false;
  distractorPlausibility: false;
  biasReview: false;
  grammar: false;
  accessibility: false;
};

export type OriginalQuestionImportReport = {
  batchId: string;
  totalOriginalQuestions: number;
  questionsPerSubject: Record<string, number>;
  questionsPerTopLevelCategory: Record<string, number>;
  questionsPendingLegalReview: number;
  questionsWithIncompleteDistractorReview: number;
  answerKeyDistribution: Record<string, number>;
  estimatedTimeDistribution: {
    min: number;
    max: number;
    average: number;
  };
  provenanceDistribution: Record<string, number>;
};

export type OriginalQuestionTaxonomyReport = {
  missingRequiredNodes: string[];
  missingSubtopicNodes: Array<{
    questionKey: string;
    subject: string;
    category: string;
    subtopic: string;
    key: string;
  }>;
};

export type ExistingOriginalQuestionVersion = {
  batchId: string | null;
  status: ContentWorkflowStatus;
  version: number;
};

export function parseOriginalQuestionBatchJson(
  content: string,
): OriginalQuestionBatch {
  const parsed = JSON.parse(content) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new OriginalQuestionImportValidationError([
      "Import file must contain a single batch object.",
    ]);
  }

  return parsed as OriginalQuestionBatch;
}

export function normalizeOriginalQuestionBatch(
  batch: OriginalQuestionBatch,
  options: {
    estimatedSeconds?: { min: number; max: number };
  } = {},
) {
  const errors = validateBatchShape(batch, options);

  if (errors.length > 0) {
    throw new OriginalQuestionImportValidationError(errors);
  }

  const questions = batch.questions.map((question) => {
    const category = canonicalCategoryFor(question.subject, question.category);

    return {
      key: question.key,
      batchId: batch.batchId,
      examTrack: question.examTrack,
      format: question.questionType,
      subject: question.subject,
      category,
      originalCategory: question.category,
      subtopic: question.subtopic,
      subjectKey: subjectKey(question.subject),
      categoryKey: categoryKey(question.subject, category),
      subtopicKey: subtopicKey(question.subject, category, question.subtopic),
      difficulty: question.difficulty,
      estimatedSeconds: question.estimatedSeconds,
      stem: question.stem,
      callOfQuestion: question.call,
      choices: question.choices.map((choice, index) => ({
        ...choice,
        dbDistractorType: mapDistractorType(choice),
        originalDistractorType: choice.distractorType,
        sortOrder: index + 1,
      })),
      correctChoice: question.correctChoice,
      explanation: question.explanation,
      authorityNotes: question.authorityNotes,
      status: ORIGINAL_QUESTION_IMPORT_STATUS,
      sourceType: normalizeOriginalQuestionProvenance(
        question.authoring.sourceType,
      ),
      publicSourceLabel: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
      publishable: false,
      licenseKey: ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY,
      reviewChecklist: emptyReviewChecklist(),
      authoring: question.authoring,
      qualityAudit: question.qualityAudit,
    } satisfies NormalizedOriginalQuestion;
  });

  return {
    batch,
    questions,
    report: buildOriginalQuestionImportReport(batch.batchId, questions),
  };
}

export function getOriginalQuestionBatchProfile(batchId: string) {
  return ORIGINAL_QUESTION_BATCH_PROFILES[batchId] ?? DEFAULT_BATCH_PROFILE;
}

export function buildOriginalQuestionTaxonomyReport(input: {
  questions: readonly NormalizedOriginalQuestion[];
  availableTaxonomyKeys: ReadonlySet<string>;
}) {
  const missingRequiredNodes = new Set<string>();
  const missingSubtopicNodes: OriginalQuestionTaxonomyReport["missingSubtopicNodes"] =
    [];

  for (const question of input.questions) {
    for (const key of [question.subjectKey, question.categoryKey]) {
      if (!input.availableTaxonomyKeys.has(key)) {
        missingRequiredNodes.add(key);
      }
    }

    if (!input.availableTaxonomyKeys.has(question.subtopicKey)) {
      missingSubtopicNodes.push({
        questionKey: question.key,
        subject: question.subject,
        category: question.category,
        subtopic: question.subtopic,
        key: question.subtopicKey,
      });
    }
  }

  return {
    missingRequiredNodes: [...missingRequiredNodes].sort(),
    missingSubtopicNodes,
  } satisfies OriginalQuestionTaxonomyReport;
}

export function validateOriginalQuestionTaxonomy(input: {
  questions: readonly NormalizedOriginalQuestion[];
  availableTaxonomyKeys: ReadonlySet<string>;
  allowCreateSubtopics: boolean;
}) {
  const errors: string[] = [];
  const report = buildOriginalQuestionTaxonomyReport(input);

  errors.push(
    ...report.missingRequiredNodes.map(
      (key) => `Taxonomy node missing: ${key}.`,
    ),
  );

  if (!input.allowCreateSubtopics) {
    errors.push(
      ...report.missingSubtopicNodes.map(
        (node) => `Taxonomy node missing for ${node.questionKey}: ${node.key}.`,
      ),
    );
  }

  if (errors.length > 0) {
    throw new OriginalQuestionImportValidationError(errors);
  }
}

export function resolveOriginalQuestionVersionWrite<
  TVersion extends ExistingOriginalQuestionVersion,
>(input: { batchId: string; existingVersions: readonly TVersion[] }) {
  const editableVersion = input.existingVersions.find(
    (version) =>
      version.batchId === input.batchId && version.status !== "PUBLISHED",
  );

  return {
    editableVersion,
    versionNumber:
      editableVersion?.version ??
      Math.max(0, ...input.existingVersions.map((version) => version.version)) +
        1,
    action: editableVersion ? "updated" : "created",
  };
}

export function buildOriginalQuestionImportReport(
  batchId: string,
  questions: readonly NormalizedOriginalQuestion[],
): OriginalQuestionImportReport {
  const estimatedSeconds = questions.map(
    (question) => question.estimatedSeconds,
  );
  const average =
    estimatedSeconds.reduce((sum, value) => sum + value, 0) /
    Math.max(1, estimatedSeconds.length);

  return {
    batchId,
    totalOriginalQuestions: questions.length,
    questionsPerSubject: countBy(questions, (question) => question.subject),
    questionsPerTopLevelCategory: countBy(
      questions,
      (question) => `${question.subject} / ${question.category}`,
    ),
    questionsPendingLegalReview: questions.filter(
      (question) => question.status === "LEGAL_REVIEW",
    ).length,
    questionsWithIncompleteDistractorReview: questions.filter((question) =>
      question.choices.some(
        (choice) => !choice.isCorrect && !choice.originalDistractorType,
      ),
    ).length,
    answerKeyDistribution: countBy(
      questions,
      (question) => question.correctChoice,
    ),
    estimatedTimeDistribution: {
      min: Math.min(...estimatedSeconds),
      max: Math.max(...estimatedSeconds),
      average: Math.round(average),
    },
    provenanceDistribution: countBy(
      questions,
      (question) => question.sourceType,
    ),
  };
}

export function canPublishOriginalQuestionVersion(input: {
  actor: ContentActor;
  status: ContentWorkflowStatus;
  publishable: boolean;
  authorId?: string | null;
  legalReviewerId?: string | null;
  editorialReviewerId?: string | null;
  twoPersonReview: boolean;
}) {
  if (input.status !== "APPROVED" || !input.publishable) {
    return false;
  }

  if (!input.legalReviewerId || !input.editorialReviewerId) {
    return false;
  }

  if (
    input.twoPersonReview &&
    (input.legalReviewerId === input.editorialReviewerId ||
      input.legalReviewerId === input.authorId ||
      input.editorialReviewerId === input.authorId)
  ) {
    return false;
  }

  return canTransitionContent({
    actor: input.actor,
    currentStatus: input.status,
    nextStatus: "PUBLISHED",
    authorId: input.authorId,
    legalReviewerId: input.legalReviewerId,
    editorialReviewerId: input.editorialReviewerId,
    twoPersonReview: input.twoPersonReview,
  });
}

export function subjectKey(subject: string) {
  return `mbe.subject.${slugifyLabel(subject)}`;
}

export function categoryKey(subject: string, category: string) {
  return `mbe.category.${slugifyLabel(subject)}.${slugifyLabel(category)}`;
}

export function subtopicKey(
  subject: string,
  category: string,
  subtopic: string,
) {
  return `mbe.subtopic.${slugifyLabel(subject)}.${slugifyLabel(category)}.${slugifyLabel(subtopic)}`;
}

function validateBatchShape(
  batch: OriginalQuestionBatch,
  options: {
    estimatedSeconds?: { min: number; max: number };
  },
) {
  const errors: string[] = [];
  const estimatedSeconds =
    options.estimatedSeconds ?? DEFAULT_ESTIMATED_SECONDS;
  const profile = getOriginalQuestionBatchProfile(batch.batchId);

  if (!["1.0", "1.1"].includes(batch.schemaVersion)) {
    errors.push("Unsupported batch schemaVersion.");
  }

  if (!batch.batchId?.trim()) {
    errors.push("Batch id is required.");
  }

  if (!isOriginalQuestionProvenance(batch.rights?.sourceType)) {
    errors.push(
      "Batch provenance must be an accepted original-question provenance.",
    );
  }

  if (batch.rights?.officialNCBEContentIncluded !== false) {
    errors.push("Batch must not include official NCBE content.");
  }

  if (batch.rights?.publicReleaseAllowed !== false) {
    errors.push("Batch must not be publicly releasable before review.");
  }

  if (batch.formatProfile?.examTrack !== "LEGACY_UBE") {
    errors.push("Batch must target LEGACY_UBE.");
  }

  if (batch.formatProfile?.questionType !== "SINGLE_SELECT") {
    errors.push("Batch must contain single-select questions.");
  }

  if (!Array.isArray(batch.questions)) {
    errors.push("Batch questions must be an array.");
    return errors;
  }

  if (batch.schemaVersion === "1.1") {
    validateAuditedBatchMetadata(batch, errors);
  }

  if (batch.questions.length !== profile.expectedBatchSize) {
    errors.push(
      `Batch must contain exactly ${profile.expectedBatchSize} questions.`,
    );
  }

  const keys = new Set<string>();
  const subjectCounts = new Map<string, number>();
  const answerDistribution: Record<string, number> = {};

  for (const question of batch.questions) {
    validateQuestion(question, errors, estimatedSeconds, batch.schemaVersion);

    if (question.key) {
      if (keys.has(question.key)) {
        errors.push(`Duplicate question key: ${question.key}.`);
      }
      keys.add(question.key);
    }

    subjectCounts.set(
      question.subject,
      (subjectCounts.get(question.subject) ?? 0) + 1,
    );
    answerDistribution[question.correctChoice] =
      (answerDistribution[question.correctChoice] ?? 0) + 1;
  }

  for (const subject of MBE_SUBJECTS) {
    if ((subjectCounts.get(subject) ?? 0) !== profile.expectedPerSubject) {
      errors.push(
        `Subject ${subject} must have exactly ${profile.expectedPerSubject} questions.`,
      );
    }
  }

  const expectedAnswerDistribution =
    profile.expectedAnswerDistribution ?? batch.answerDistribution;
  if (
    expectedAnswerDistribution &&
    !sameChoiceDistribution(answerDistribution, expectedAnswerDistribution)
  ) {
    errors.push(
      "Batch answer distribution does not match the expected profile.",
    );
  }

  if (
    batch.answerDistribution &&
    !sameChoiceDistribution(answerDistribution, batch.answerDistribution)
  ) {
    errors.push(
      "Declared answer distribution does not match question records.",
    );
  }

  return errors;
}

function validateQuestion(
  question: OriginalQuestionDraft,
  errors: string[],
  estimatedSeconds: { min: number; max: number },
  schemaVersion: string,
) {
  for (const field of [
    "key",
    "stem",
    "call",
    "subject",
    "category",
    "subtopic",
  ] as const) {
    if (!question[field]?.trim()) {
      errors.push(
        `Question ${question.key || "(missing key)"} lacks ${field}.`,
      );
    }
  }

  for (const field of [
    "testedIssue",
    "governingRule",
    "application",
    "commonTrap",
    "memoryAid",
  ] as const) {
    if (!question.explanation?.[field]?.trim()) {
      errors.push(`Question ${question.key} lacks ${field}.`);
    }
  }

  if (
    !MBE_SUBJECTS.includes(question.subject as (typeof MBE_SUBJECTS)[number])
  ) {
    errors.push(`Question ${question.key} has an invalid legacy subject.`);
  }

  const canonicalCategory = canonicalCategoryFor(
    question.subject,
    question.category,
  );
  const validCategories =
    MBE_CATEGORIES_BY_SUBJECT[
      question.subject as keyof typeof MBE_CATEGORIES_BY_SUBJECT
    ] ?? [];

  if (!validCategories.includes(canonicalCategory as never)) {
    errors.push(
      `Question ${question.key} category does not map to a canonical taxonomy category.`,
    );
  }

  if (
    !Number.isInteger(question.estimatedSeconds) ||
    question.estimatedSeconds < estimatedSeconds.min ||
    question.estimatedSeconds > estimatedSeconds.max
  ) {
    errors.push(`Question ${question.key} estimatedSeconds is out of range.`);
  }

  if (question.examTrack !== "LEGACY_UBE") {
    errors.push(`Question ${question.key} must target LEGACY_UBE.`);
  }

  if (question.questionType !== "SINGLE_SELECT") {
    errors.push(`Question ${question.key} must be SINGLE_SELECT.`);
  }

  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    errors.push(`Question ${question.key} must have exactly four choices.`);
    return;
  }

  const labels = question.choices.map((choice) => choice.label);
  if (labels.join("") !== CHOICE_LABELS.join("")) {
    errors.push(
      `Question ${question.key} choices must be labeled A through D.`,
    );
  }

  const correctChoices = question.choices.filter((choice) => choice.isCorrect);
  if (correctChoices.length !== 1) {
    errors.push(
      `Question ${question.key} must have exactly one correct choice.`,
    );
  }

  if (correctChoices[0]?.label !== question.correctChoice) {
    errors.push(
      `Question ${question.key} correctChoice disagrees with choices.`,
    );
  }

  for (const choice of question.choices) {
    if (!choice.text?.trim()) {
      errors.push(
        `Question ${question.key} choice ${choice.label} lacks text.`,
      );
    }

    if (!choice.rationale?.trim()) {
      errors.push(
        `Question ${question.key} choice ${choice.label} lacks a rationale.`,
      );
    }

    if (!choice.isCorrect && !choice.distractorType?.trim()) {
      errors.push(
        `Question ${question.key} choice ${choice.label} lacks a distractor type.`,
      );
    }

    if (choice.isCorrect && choice.distractorType?.trim()) {
      errors.push(
        `Question ${question.key} choice ${choice.label} is correct and must not have a distractor type.`,
      );
    }
  }

  if (!isOriginalQuestionProvenance(question.authoring?.sourceType)) {
    errors.push(`Question ${question.key} lacks required provenance.`);
  }

  if (
    question.authoring?.licenseKey !== ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY
  ) {
    errors.push(`Question ${question.key} uses an unexpected license key.`);
  }

  if (
    question.authoring?.officialQuestion !== false ||
    question.authoring?.publishable !== false
  ) {
    errors.push(`Question ${question.key} is marked official or publishable.`);
  }

  if (
    question.authoring?.status !== ORIGINAL_QUESTION_IMPORT_STATUS ||
    question.authoring?.requiresAttorneyApproval !== true
  ) {
    errors.push(`Question ${question.key} lacks required review metadata.`);
  }

  if (schemaVersion === "1.1") {
    validateQuestionQualityAudit(question, errors);
  }
}

function validateAuditedBatchMetadata(
  batch: OriginalQuestionBatch,
  errors: string[],
) {
  if (
    batch.rights.officialSampleUsedOnlyForGeneralFormatStudy !== true ||
    batch.rights.officialNCBEContentIncluded !== false
  ) {
    errors.push(
      "Audited batch must confirm no official NCBE content is included.",
    );
  }

  if (
    batch.internalAudit?.status !==
    "PASS_PENDING_EXTERNAL_ATTORNEY_AND_EDITORIAL_REVIEW"
  ) {
    errors.push("Audited batch must remain pending external review.");
  }

  if (batch.internalAudit?.questionsAudited !== batch.questions.length) {
    errors.push("Audited batch question count does not match audit metadata.");
  }
}

function validateQuestionQualityAudit(
  question: OriginalQuestionDraft,
  errors: string[],
) {
  const audit = question.qualityAudit;

  if (!audit) {
    errors.push(`Question ${question.key} lacks quality audit metadata.`);
    return;
  }

  if (
    audit.status !== "INTERNAL_SECOND_PASS_PASS_PENDING_ATTORNEY_REVIEW" ||
    !audit.auditVersion?.trim() ||
    !audit.secondPassNotes?.trim()
  ) {
    errors.push(`Question ${question.key} lacks legal-review audit metadata.`);
  }

  if (!["LOW", "MODERATE"].includes(audit.residualRisk)) {
    errors.push(`Question ${question.key} has unsupported residual risk.`);
  }

  const checks = audit.checks;
  if (
    !checks?.oneBestAnswerInternallyConfirmed ||
    !checks.ruleAndApplicationInternallyChecked ||
    !checks.factsSufficientForKeyedAnswer ||
    !checks.distractorsPlausibleAndMutuallyExclusive ||
    !checks.optionsGrammaticallyParallel ||
    checks.officialSampleTextCopied !== false ||
    checks.priorBatchQuestionDuplicated !== false
  ) {
    errors.push(`Question ${question.key} did not pass required audit checks.`);
  }
}

export function isOriginalQuestionProvenance(
  value: unknown,
): value is OriginalQuestionProvenance {
  return ORIGINAL_QUESTION_PROVENANCES.includes(
    value as OriginalQuestionProvenance,
  );
}

function normalizeOriginalQuestionProvenance(
  value: string,
): OriginalQuestionProvenance {
  if (!isOriginalQuestionProvenance(value)) {
    throw new OriginalQuestionImportValidationError([
      `Unsupported original-question provenance: ${value}.`,
    ]);
  }

  return value;
}

function canonicalCategoryFor(subject: string, category: string) {
  return canonicalCategoryAliases[`${subject}::${category}`] ?? category;
}

function mapDistractorType(choice: OriginalChoiceDraft): DistractorType {
  if (choice.isCorrect) {
    return "NONE";
  }

  const value = choice.distractorType ?? "";

  if (value.startsWith("IRRELEVANT")) {
    return "IRRELEVANT";
  }

  if (
    value.startsWith("OVERBROAD") ||
    value.startsWith("ADDS") ||
    value.startsWith("INCOMPLETE")
  ) {
    return "OVERGENERALIZATION";
  }

  if (
    value.startsWith("CONFUSES") ||
    value.startsWith("MISCLASSIFIES") ||
    value.startsWith("MISIDENTIFIES") ||
    value.startsWith("UNDERESTIMATES")
  ) {
    return "FACT_CONFUSION";
  }

  if (value.startsWith("SCOPE")) {
    return "SCOPE_ERROR";
  }

  return "MISSTATEMENT";
}

function emptyReviewChecklist(): ReviewChecklist {
  return {
    legalAccuracy: false,
    oneBestAnswer: false,
    distractorPlausibility: false,
    biasReview: false,
    grammar: false,
    accessibility: false,
  };
}

function countBy<T>(items: readonly T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function sameChoiceDistribution(
  actual: Record<string, number>,
  expected: Record<string, number>,
) {
  return CHOICE_LABELS.every(
    (label) => (actual[label] ?? 0) === (expected[label] ?? 0),
  );
}
