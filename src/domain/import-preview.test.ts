import { describe, expect, it } from "vitest";

import {
  previewQuestionImport,
  previewQuestionImportFile,
} from "./import-preview";

const validTopics = ["mbe.category.civil-procedure.jurisdiction-and-venue"];
const validLicenses = ["demo-license"];

describe("question import preview", () => {
  it("accepts valid demonstration rows", () => {
    const result = previewQuestionImport({
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
      rows: [validRow()],
    });

    expect(result.acceptedRows).toHaveLength(1);
    expect(result.rejectedRows).toHaveLength(0);
  });

  it("supports JSON import previews", () => {
    const result = previewQuestionImportFile({
      format: "JSON",
      content: JSON.stringify([validRow()]),
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
    });

    expect(result.acceptedRows).toHaveLength(1);
  });

  it("supports CSV import previews", () => {
    const row = validRow();
    const headers = Object.keys(row);
    const values = headers.map((header) => row[header as keyof typeof row]);

    const result = previewQuestionImportFile({
      format: "CSV",
      content: `${headers.join(",")}\n${values.map((value) => `"${value}"`).join(",")}`,
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
    });

    expect(result.acceptedRows).toHaveLength(1);
  });

  it("rejects missing required fields", () => {
    const row = validRow();
    row.stem = "";

    const result = previewQuestionImport({
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
      rows: [row],
    });

    expect(result.rejectedRows[0]?.errors).toContain(
      "Required field missing: stem.",
    );
  });

  it("rejects single-select rows without exactly one correct answer", () => {
    const row = validRow();
    row.correctLabels = "A|B";

    const result = previewQuestionImport({
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
      rows: [row],
    });

    expect(result.rejectedRows[0]?.errors).toContain(
      "A single-select question must have exactly one correct answer.",
    );
  });

  it("rejects invalid topics, missing licenses, rationales, and dates", () => {
    const row = validRow();
    row.primaryTopic = "invalid-topic";
    row.licenseKey = "missing-license";
    row.rationales = "A:Correct rationale";
    row.effectiveTo = "2026-01-01";

    const result = previewQuestionImport({
      validTopicKeys: validTopics,
      validLicenseKeys: validLicenses,
      rows: [row],
    });

    expect(result.rejectedRows[0]?.errors).toEqual(
      expect.arrayContaining([
        "Topic is invalid.",
        "License is missing.",
        "Choice B requires a rationale.",
        "Effective dates are inconsistent.",
      ]),
    );
    expect(result.errorReportCsv).toContain("rowNumber,errors");
  });
});

function validRow() {
  return {
    id: "demo-import-question-1",
    subject: "Civil Procedure",
    category: "Jurisdiction and venue",
    examTrack: "LEGACY_UBE",
    format: "SINGLE_SELECT",
    stem: "DEMO_NOT_FOR_PUBLICATION stem",
    callOfQuestion: "DEMO_NOT_FOR_PUBLICATION call",
    choices: "DEMO_NOT_FOR_PUBLICATION A|DEMO_NOT_FOR_PUBLICATION B",
    correctLabels: "A",
    rationales: "A:Correct rationale|B:Incorrect rationale",
    distractorTypes: "B:SCOPE_ERROR",
    primaryTopic: "mbe.category.civil-procedure.jurisdiction-and-venue",
    secondaryTopics: "",
    difficulty: "MEDIUM",
    estimatedSeconds: "90",
    licenseKey: "demo-license",
    sourceKey: "demo-source",
    authorId: "demo-author",
    effectiveFrom: "2026-06-24",
    effectiveTo: "2026-12-31",
    version: "1",
  };
}
