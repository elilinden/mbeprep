import type {
  DemoEssayVersion,
  DemoLicense,
  DemoPodcastEpisode,
  DemoQuestionVersion,
} from "./admin-content-types";

export type CoverageInput = {
  questions: readonly DemoQuestionVersion[];
  essays: readonly DemoEssayVersion[];
  podcasts: readonly DemoPodcastEpisode[];
  licenses: readonly DemoLicense[];
  taxonomyCategories: ReadonlyArray<{ subject: string; category: string }>;
  asOf: Date;
  soonExpiringDays: number;
  reviewOverdueDays: number;
};

export function buildCoverageReport(input: CoverageInput) {
  const publishedQuestions = input.questions.filter(
    (question) => question.status === "PUBLISHED",
  );
  const publishedByCategory = new Map<string, number>();

  for (const question of publishedQuestions) {
    const key = categoryKey(question.subject, question.category);
    publishedByCategory.set(key, (publishedByCategory.get(key) ?? 0) + 1);
  }

  return {
    publishedQuestionsBySubjectAndCategory:
      Object.fromEntries(publishedByCategory),
    zeroPublishedQuestionTopics: input.taxonomyCategories.filter(
      (category) =>
        !publishedByCategory.has(
          categoryKey(category.subject, category.category),
        ),
    ),
    questionsMissingCompleteRationales: input.questions.filter(
      (question) =>
        question.choices.some((choice) => !choice.rationale.trim()) ||
        question.choices.some(
          (choice) => !choice.isCorrect && choice.distractorType === "NONE",
        ),
    ),
    essaysMissingRubrics: input.essays.filter(
      (essay) => essay.rubricItems.length === 0,
    ),
    podcastsMissingTranscripts: input.podcasts.filter(
      (podcast) =>
        !podcast.transcriptText?.trim() && !podcast.transcriptUri?.trim(),
    ),
    expiredOrSoonExpiringLicenses: input.licenses.filter((license) =>
      isExpiredOrSoonExpiring(license, input.asOf, input.soonExpiringDays),
    ),
    contentOverdueForReview: input.questions.filter((question) => {
      const lastReviewedAt = question.lastReviewedAt ?? question.effectiveFrom;
      const overdueAt = new Date(lastReviewedAt);
      overdueAt.setUTCDate(overdueAt.getUTCDate() + input.reviewOverdueDays);
      return overdueAt < input.asOf;
    }),
  };
}

function categoryKey(subject: string, category: string) {
  return `${subject} / ${category}`;
}

function isExpiredOrSoonExpiring(
  license: DemoLicense,
  asOf: Date,
  soonExpiringDays: number,
) {
  if (license.status === "EXPIRED" || license.status === "TERMINATED") {
    return true;
  }

  if (!license.expiresAt) {
    return false;
  }

  const soon = new Date(asOf);
  soon.setUTCDate(soon.getUTCDate() + soonExpiringDays);
  return license.expiresAt <= soon;
}
