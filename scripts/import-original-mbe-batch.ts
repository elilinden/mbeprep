import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { DEVELOPMENT_USERS } from "@/domain/seed-data";
import {
  ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
  ORIGINAL_QUESTION_IMPORT_STATUS,
  ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY,
  ORIGINAL_QUESTION_PROVENANCE,
  ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
  OriginalQuestionImportValidationError,
  buildOriginalQuestionTaxonomyReport,
  getOriginalQuestionBatchProfile,
  normalizeOriginalQuestionBatch,
  parseOriginalQuestionBatchJson,
  resolveOriginalQuestionVersionWrite,
  validateOriginalQuestionTaxonomy,
} from "@/domain/original-question-import";
import { env } from "@/env/server";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  log: ["error"],
});

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Usage: npm run content:import -- data/import/mbe_original_question_bank_batch_001.json",
    );
  }

  const absolutePath = path.resolve(inputPath);
  const content = await readFile(absolutePath, "utf8");
  const fileHash = createHash("sha256").update(content).digest("hex");
  const parsed = parseOriginalQuestionBatchJson(content);
  const normalized = normalizeOriginalQuestionBatch(parsed);
  const batchSourceType =
    normalized.questions[0]?.sourceType ?? ORIGINAL_QUESTION_PROVENANCE;
  const batchProfile = getOriginalQuestionBatchProfile(
    normalized.batch.batchId,
  );

  const result = await prisma.$transaction(async (tx) => {
    const legacyTrack = await tx.examTrack.findUnique({
      where: { code: "LEGACY_UBE" },
    });

    if (!legacyTrack) {
      throw new OriginalQuestionImportValidationError([
        "LEGACY_UBE exam track is missing. Run prisma seed before importing.",
      ]);
    }

    const taxonomyNodes = await tx.taxonomyNode.findMany({
      where: {
        key: {
          in: [
            ...new Set(
              normalized.questions.flatMap((question) => [
                question.subjectKey,
                question.categoryKey,
                question.subtopicKey,
              ]),
            ),
          ],
        },
        status: "ACTIVE",
      },
      orderBy: { effectiveFrom: "desc" },
    });
    const taxonomyByKey = new Map(
      taxonomyNodes.map((node) => [node.key, node]),
    );
    const taxonomyReport = buildOriginalQuestionTaxonomyReport({
      questions: normalized.questions,
      availableTaxonomyKeys: new Set(taxonomyByKey.keys()),
    });

    try {
      validateOriginalQuestionTaxonomy({
        questions: normalized.questions,
        availableTaxonomyKeys: new Set(taxonomyByKey.keys()),
        allowCreateSubtopics: batchProfile.allowCreateSubtopics,
      });
    } catch (error) {
      if (error instanceof OriginalQuestionImportValidationError) {
        throw new OriginalQuestionImportValidationError([
          ...error.errors,
          `Taxonomy mapping report: ${JSON.stringify(taxonomyReport)}`,
        ]);
      }

      throw error;
    }

    const importer = await tx.user.findUnique({
      where: { email: DEVELOPMENT_USERS.admin.email },
    });

    const license = await tx.contentLicense.upsert({
      where: { key: ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY },
      update: {
        copyrightOwner: parsed.rights.copyrightOwner,
        allowedUses: [
          "Internal drafting",
          "Legal review",
          "Editorial review",
          "Approved learner practice after publication",
        ],
        attribution: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
        status: "ACTIVE",
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      },
      create: {
        key: ORIGINAL_QUESTION_INTERNAL_LICENSE_KEY,
        copyrightOwner: parsed.rights.copyrightOwner,
        allowedUses: [
          "Internal drafting",
          "Legal review",
          "Editorial review",
          "Approved learner practice after publication",
        ],
        attribution: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      },
    });

    const source = await tx.contentSource.upsert({
      where: { key: normalized.batch.batchId },
      update: {
        licenseId: license.id,
        title: normalized.batch.title,
        sourceType: batchSourceType,
        attribution: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
        status: "DRAFT",
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      },
      create: {
        key: normalized.batch.batchId,
        licenseId: license.id,
        title: normalized.batch.title,
        sourceType: batchSourceType,
        attribution: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      },
    });

    const questionResults = [];

    for (const question of normalized.questions) {
      const category = taxonomyByKey.get(question.categoryKey);

      if (!category) {
        throw new OriginalQuestionImportValidationError([
          `Taxonomy category missing for ${question.key}: ${question.categoryKey}.`,
        ]);
      }

      const existingSubtopic = taxonomyByKey.get(question.subtopicKey);
      const subtopic =
        existingSubtopic ??
        (batchProfile.allowCreateSubtopics
          ? await tx.taxonomyNode.upsert({
              where: {
                key_effectiveFrom: {
                  key: question.subtopicKey,
                  effectiveFrom: category.effectiveFrom,
                },
              },
              update: {
                name: question.subtopic,
                slug:
                  question.subtopicKey.split(".").at(-1) ?? question.subtopic,
                nodeType: "SUBTOPIC",
                parentId: category.id,
                examTrackId: legacyTrack.id,
                status: "ACTIVE",
                dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
              },
              create: {
                key: question.subtopicKey,
                slug:
                  question.subtopicKey.split(".").at(-1) ?? question.subtopic,
                name: question.subtopic,
                nodeType: "SUBTOPIC",
                parentId: category.id,
                examTrackId: legacyTrack.id,
                effectiveFrom: category.effectiveFrom,
                dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
              },
            })
          : null);

      if (!subtopic) {
        throw new OriginalQuestionImportValidationError([
          `Taxonomy subtopic missing for ${question.key}: ${question.subtopicKey}.`,
        ]);
      }
      taxonomyByKey.set(question.subtopicKey, subtopic);

      const questionRecord = await tx.question.upsert({
        where: { key: question.key },
        update: {
          status: ORIGINAL_QUESTION_IMPORT_STATUS,
          dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
        },
        create: {
          key: question.key,
          status: ORIGINAL_QUESTION_IMPORT_STATUS,
          dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
        },
        include: {
          versions: {
            orderBy: { version: "desc" },
          },
        },
      });

      const versionWrite = resolveOriginalQuestionVersionWrite({
        batchId: normalized.batch.batchId,
        existingVersions: questionRecord.versions,
      });
      const editableVersion = versionWrite.editableVersion;

      const versionData = {
        examTrackId: legacyTrack.id,
        format: question.format,
        stem: question.stem,
        callOfQuestion: question.callOfQuestion,
        primaryTopicId: subtopic.id,
        difficulty: question.difficulty,
        estimatedSeconds: question.estimatedSeconds,
        sourceId: source.id,
        licenseId: license.id,
        authorId: importer?.id,
        reviewerId: null,
        batchId: question.batchId,
        provenance: question.sourceType,
        publicSourceLabel: question.publicSourceLabel,
        publishable: false,
        testedIssue: question.explanation.testedIssue,
        governingRule: question.explanation.governingRule,
        application: question.explanation.application,
        commonTrap: question.explanation.commonTrap,
        memoryAid: question.explanation.memoryAid,
        authorityNotes: question.authorityNotes,
        reviewChecklist: question.reviewChecklist,
        importMetadata: toInputJson({
          originalCategory: question.originalCategory,
          originalDistractorTypes: Object.fromEntries(
            question.choices.map((choice) => [
              choice.label,
              choice.originalDistractorType,
            ]),
          ),
          authoring: question.authoring,
          qualityAudit: question.qualityAudit ?? null,
          warning:
            "AI-assisted draft. Requires independent legal and editorial review.",
          rights: {
            ...parsed.rights,
            sourceType: question.sourceType,
          },
          formatProfile: parsed.formatProfile,
          internalAudit: parsed.internalAudit ?? null,
          relatedPriorBatches: parsed.relatedPriorBatches ?? [],
          researchBasis: parsed.researchBasis ?? null,
          coveragePlan: parsed.coveragePlan ?? null,
          batchAnswerDistribution: parsed.answerDistribution,
        }),
        effectiveFrom: new Date(),
        effectiveTo: null,
        status: question.status,
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      };

      const version = editableVersion
        ? await tx.questionVersion.update({
            where: { id: editableVersion.id },
            data: versionData,
          })
        : await tx.questionVersion.create({
            data: {
              ...versionData,
              questionId: questionRecord.id,
              version: versionWrite.versionNumber,
            },
          });

      await tx.questionChoice.deleteMany({
        where: { questionVersionId: version.id },
      });
      await tx.questionChoice.createMany({
        data: question.choices.map((choice) => ({
          questionVersionId: version.id,
          label: choice.label,
          text: choice.text,
          isCorrect: choice.isCorrect,
          rationale: choice.rationale,
          distractorType: choice.dbDistractorType,
          sortOrder: choice.sortOrder,
        })),
      });

      await tx.questionTopic.deleteMany({
        where: { questionVersionId: version.id },
      });
      await tx.questionTopic.createMany({
        data: [
          {
            questionVersionId: version.id,
            taxonomyNodeId: subtopic.id,
            isPrimary: true,
            sortOrder: 1,
          },
          {
            questionVersionId: version.id,
            taxonomyNodeId: category.id,
            isPrimary: false,
            sortOrder: 2,
          },
        ],
        skipDuplicates: true,
      });

      questionResults.push({
        key: question.key,
        version: version.version,
        status: version.status,
        questionVersionId: version.id,
        action: versionWrite.action,
      });
    }

    const importJob = await tx.importJob.create({
      data: {
        format: "JSON",
        status: "IMPORTED",
        filename: absolutePath,
        submittedById: importer?.id,
        rowCount: normalized.questions.length,
        acceptedRows: normalized.questions.length,
        rejectedRows: 0,
        previewJson: normalized.report,
        dataClassification: ORIGINAL_QUESTION_BATCH_CLASSIFICATION,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: importer?.id,
        action: "ORIGINAL_QUESTION_BATCH_IMPORTED",
        entityType: "ImportJob",
        entityId: importJob.id,
        metadata: {
          batchId: normalized.batch.batchId,
          filename: absolutePath,
          fileHash,
          questionCount: normalized.questions.length,
          validationOutcome: "IMPORTED",
          provenance: batchSourceType,
        },
      },
    });

    return {
      importJobId: importJob.id,
      fileHash,
      report: normalized.report,
      taxonomyReport,
      questions: questionResults,
    };
  }, { timeout: 120_000 });

  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main()
  .catch((error: unknown) => {
    if (error instanceof OriginalQuestionImportValidationError) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            status: "FAILED_VALIDATION",
            acceptedRows: 0,
            rejectedRows: "all",
            databaseWritten: false,
            errors: error.errors,
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    console.error(
      JSON.stringify(
        {
          ok: false,
          error: formatUnknownError(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function formatUnknownError(error: unknown) {
  if (error instanceof AggregateError) {
    return error.errors
      .map((item) => (item instanceof Error ? item.message : String(item)))
      .join("; ");
  }

  if (error instanceof Error) {
    return error.message || error.name;
  }

  return String(error);
}

function toInputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}
