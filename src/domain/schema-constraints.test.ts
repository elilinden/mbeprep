import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readAllMigrationSql();

describe("database constraints", () => {
  it("declares uniqueness constraints for stable domain identifiers", () => {
    expect(migrationSql).toContain('"User_email_key"');
    expect(migrationSql).toContain('"ExamTrack_code_key"');
    expect(migrationSql).toContain(
      '"JurisdictionExamVersion_jurisdiction_examTrackId_effectiveF_key"',
    );
    expect(migrationSql).toContain('"TaxonomyNode_key_effectiveFrom_key"');
    expect(migrationSql).toContain('"Rule_key_key"');
    expect(migrationSql).toContain('"RuleVersion_ruleId_version_key"');
    expect(migrationSql).toContain('"ContentLicense_key_key"');
    expect(migrationSql).toContain('"ContentSource_key_key"');
    expect(migrationSql).toContain('"Question_key_key"');
    expect(migrationSql).toContain('"QuestionVersion_questionId_version_key"');
    expect(migrationSql).toContain(
      '"QuestionChoice_questionVersionId_label_key"',
    );
    expect(migrationSql).toContain('"Essay_key_key"');
    expect(migrationSql).toContain('"EssayVersion_essayId_version_key"');
    expect(migrationSql).toContain('"PodcastEpisode_key_key"');
    expect(migrationSql).toContain(
      '"SessionQuestion_practiceSessionId_position_key"',
    );
    expect(migrationSql).toContain(
      '"QuestionAttempt_practiceSessionId_idempotencyKey_key"',
    );
    expect(migrationSql).toContain('"SimulationBlueprint_key_version_key"');
    expect(migrationSql).toContain(
      '"QuestionBookmark_userId_questionVersionId_key"',
    );
    expect(migrationSql).toContain(
      '"TopicMasteryState_userId_taxonomyNodeId_algorithmVersion_key"',
    );
  });

  it("declares foreign keys for core domain relationships", () => {
    expect(migrationSql).toContain('"UserRole_userId_fkey"');
    expect(migrationSql).toContain('"LearnerProfile_userId_fkey"');
    expect(migrationSql).toContain(
      '"JurisdictionExamVersion_examTrackId_fkey"',
    );
    expect(migrationSql).toContain('"TaxonomyNode_parentId_fkey"');
    expect(migrationSql).toContain('"RuleVersion_ruleId_fkey"');
    expect(migrationSql).toContain('"ContentSource_licenseId_fkey"');
    expect(migrationSql).toContain('"AuditLog_userId_fkey"');
    expect(migrationSql).toContain('"QuestionVersion_questionId_fkey"');
    expect(migrationSql).toContain('"QuestionChoice_questionVersionId_fkey"');
    expect(migrationSql).toContain('"QuestionTopic_taxonomyNodeId_fkey"');
    expect(migrationSql).toContain(
      '"QuestionVersion_lawyeringSkillTopicId_fkey"',
    );
    expect(migrationSql).toContain('"SimulationBlueprint_examTrackId_fkey"');
    expect(migrationSql).toContain('"EssayRubricItem_essayVersionId_fkey"');
    expect(migrationSql).toContain('"PodcastEpisode_seriesId_fkey"');
    expect(migrationSql).toContain('"ContentReview_reviewerId_fkey"');
    expect(migrationSql).toContain('"ImportJob_submittedById_fkey"');
    expect(migrationSql).toContain('"PracticeSession_userId_fkey"');
    expect(migrationSql).toContain('"SessionQuestion_questionVersionId_fkey"');
    expect(migrationSql).toContain('"QuestionAttempt_sessionQuestionId_fkey"');
    expect(migrationSql).toContain('"AttemptChoice_questionChoiceId_fkey"');
    expect(migrationSql).toContain('"QuestionNote_questionVersionId_fkey"');
    expect(migrationSql).toContain('"TopicMasteryState_taxonomyNodeId_fkey"');
    expect(migrationSql).toContain('"MasteryEvent_questionAttemptId_fkey"');
    expect(migrationSql).toContain('"ReviewItem_userId_fkey"');
    expect(migrationSql).toContain('"ReviewAttempt_reviewItemId_fkey"');
  });
});

function readAllMigrationSql() {
  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const migrations = readdirSync(migrationsDir)
    .filter((name) => /^\d+_/.test(name))
    .sort();

  if (migrations.length === 0) {
    throw new Error("No Prisma migration directory found.");
  }

  return migrations
    .map((migration) =>
      readFileSync(join(migrationsDir, migration, "migration.sql"), "utf8"),
    )
    .join("\n");
}
