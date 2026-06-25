import type {
  DemoQuestionVersion,
  DistractorType,
  QuestionFormat,
} from "./admin-content-types";
import { validateQuestionVersion } from "./question-validation";

export type ImportPreviewInput = {
  rows: Array<Record<string, string>>;
  validTopicKeys: readonly string[];
  validLicenseKeys: readonly string[];
};

export type ImportPreviewResult = {
  acceptedRows: DemoQuestionVersion[];
  rejectedRows: Array<{
    rowNumber: number;
    errors: string[];
    row: Record<string, string>;
  }>;
  errorReportCsv: string;
};

export function previewQuestionImportFile(input: {
  format: "CSV" | "JSON";
  content: string;
  validTopicKeys: readonly string[];
  validLicenseKeys: readonly string[];
}) {
  return previewQuestionImport({
    rows:
      input.format === "JSON"
        ? parseJsonRows(input.content)
        : parseCsvRows(input.content),
    validTopicKeys: input.validTopicKeys,
    validLicenseKeys: input.validLicenseKeys,
  });
}

export function previewQuestionImport(
  input: ImportPreviewInput,
): ImportPreviewResult {
  const validTopics = new Set(input.validTopicKeys);
  const validLicenses = new Set(input.validLicenseKeys);
  const acceptedRows: DemoQuestionVersion[] = [];
  const rejectedRows: ImportPreviewResult["rejectedRows"] = [];

  input.rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const errors = validateImportRow(row, validTopics, validLicenses);

    if (errors.length > 0) {
      rejectedRows.push({ rowNumber, errors, row });
      return;
    }

    acceptedRows.push(rowToQuestion(row));
  });

  return {
    acceptedRows,
    rejectedRows,
    errorReportCsv: buildErrorReportCsv(rejectedRows),
  };
}

function parseJsonRows(content: string) {
  const parsed = JSON.parse(content) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("JSON import must be an array of row objects.");
  }

  return parsed.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("JSON import rows must be objects.");
    }

    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, String(value ?? "")]),
    );
  });
}

function parseCsvRows(content: string) {
  const [headerLine, ...dataLines] = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine);
  return dataLines.map((line) =>
    Object.fromEntries(
      parseCsvLine(line).map((value, index) => [headers[index] ?? "", value]),
    ),
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function validateImportRow(
  row: Record<string, string>,
  validTopics: Set<string>,
  validLicenses: Set<string>,
) {
  const requiredFields = [
    "id",
    "subject",
    "category",
    "examTrack",
    "format",
    "stem",
    "callOfQuestion",
    "choices",
    "correctLabels",
    "rationales",
    "primaryTopic",
    "difficulty",
    "estimatedSeconds",
    "licenseKey",
    "sourceKey",
    "authorId",
    "effectiveFrom",
  ];
  const errors = requiredFields
    .filter((field) => !row[field]?.trim())
    .map((field) => `Required field missing: ${field}.`);

  if (row.primaryTopic && !validTopics.has(row.primaryTopic)) {
    errors.push("Topic is invalid.");
  }

  if (row.licenseKey && !validLicenses.has(row.licenseKey)) {
    errors.push("License is missing.");
  }

  const question = rowToQuestion(row);
  errors.push(...validateQuestionVersion(question));
  return errors;
}

function rowToQuestion(row: Record<string, string>): DemoQuestionVersion {
  const correctLabels = new Set(splitList(row.correctLabels));
  const rationaleByLabel = parseKeyValueList(row.rationales);
  const distractorByLabel = parseKeyValueList(row.distractorTypes);
  const choices = splitList(row.choices).map((choiceText, index) => {
    const label = String.fromCharCode(65 + index);
    const isCorrect = correctLabels.has(label);

    return {
      label,
      text: choiceText,
      isCorrect,
      rationale: rationaleByLabel[label] ?? "",
      distractorType: isCorrect
        ? "NONE"
        : ((distractorByLabel[label] ?? "NONE") as DistractorType),
    };
  });

  return {
    id: row.id ?? "",
    subject: row.subject ?? "",
    category: row.category ?? "",
    examTrack: (row.examTrack ??
      "LEGACY_UBE") as DemoQuestionVersion["examTrack"],
    format: (row.format ?? "SINGLE_SELECT") as QuestionFormat,
    stem: row.stem ?? "",
    callOfQuestion: row.callOfQuestion ?? "",
    choices,
    primaryTopic: row.primaryTopic ?? "",
    secondaryTopics: splitList(row.secondaryTopics),
    difficulty: (row.difficulty ??
      "MEDIUM") as DemoQuestionVersion["difficulty"],
    estimatedSeconds: Number(row.estimatedSeconds ?? 0),
    licenseKey: row.licenseKey ?? "",
    sourceKey: row.sourceKey ?? "",
    authorId: row.authorId ?? "",
    reviewerId: row.reviewerId,
    effectiveFrom: new Date(row.effectiveFrom ?? ""),
    effectiveTo: row.effectiveTo ? new Date(row.effectiveTo) : null,
    status: "DRAFT",
    version: Number(row.version ?? 1),
    dataClassification: "DEMO_NOT_FOR_PUBLICATION",
  };
}

function splitList(value = "") {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseKeyValueList(value = "") {
  return Object.fromEntries(
    splitList(value).map((entry) => {
      const [key = "", ...rest] = entry.split(":");
      return [key.trim(), rest.join(":").trim()];
    }),
  );
}

function buildErrorReportCsv(
  rejectedRows: ImportPreviewResult["rejectedRows"],
) {
  const lines = ["rowNumber,errors"];

  for (const rejected of rejectedRows) {
    lines.push(
      `${rejected.rowNumber},"${rejected.errors.join("; ").replaceAll('"', '""')}"`,
    );
  }

  return lines.join("\n");
}
