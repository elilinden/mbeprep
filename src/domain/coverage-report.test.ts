import { describe, expect, it } from "vitest";

import { buildCoverageReport } from "./coverage-report";
import {
  demoEssays,
  demoLicenses,
  demoPodcasts,
  demoQuestions,
} from "./demo-admin-content";

describe("coverage report", () => {
  it("summarizes published questions and content gaps", () => {
    const report = buildCoverageReport({
      questions: demoQuestions,
      essays: demoEssays,
      podcasts: demoPodcasts,
      licenses: demoLicenses,
      taxonomyCategories: [
        {
          subject: "Civil Procedure",
          category: "Jurisdiction and venue",
        },
        {
          subject: "Evidence",
          category: "Privileges",
        },
      ],
      asOf: new Date("2026-06-24T00:00:00.000Z"),
      soonExpiringDays: 30,
      reviewOverdueDays: 90,
    });

    expect(
      report.publishedQuestionsBySubjectAndCategory[
        "Civil Procedure / Jurisdiction and venue"
      ],
    ).toBe(1);
    expect(report.zeroPublishedQuestionTopics).toContainEqual({
      subject: "Evidence",
      category: "Privileges",
    });
    expect(report.questionsMissingCompleteRationales).toHaveLength(1);
    expect(report.essaysMissingRubrics).toHaveLength(1);
    expect(report.podcastsMissingTranscripts).toHaveLength(1);
    expect(report.expiredOrSoonExpiringLicenses).toHaveLength(1);
    expect(report.contentOverdueForReview).toHaveLength(1);
  });
});
