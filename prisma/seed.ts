import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  ExamTrackCode,
  PrismaClient,
  TaxonomyNodeType,
  UserRoleCode,
} from "../src/generated/prisma/client";
import {
  DEMO_CLASSIFICATION,
  DEVELOPMENT_USERS,
  LEGACY_MEE_SUBJECTS_BEGINNING_JULY_2026,
  MBE_CATEGORIES_BY_SUBJECT,
  MBE_SUBJECTS,
  NEXTGEN_SKILL_CATEGORY_LABELS,
  slugifyLabel,
} from "../src/domain/seed-data";

const LEGACY_EFFECTIVE_FROM = new Date("2011-01-01T00:00:00.000Z");
const JULY_2026_EFFECTIVE_FROM = new Date("2026-07-01T00:00:00.000Z");
const LEGACY_EFFECTIVE_TO = new Date("2028-02-29T23:59:59.999Z");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction(async (tx) => {
    const [legacyTrack, nextGenTrack, stateSpecificTrack] = await Promise.all([
      tx.examTrack.upsert({
        where: { code: ExamTrackCode.LEGACY_UBE },
        update: {
          name: "Legacy UBE",
          status: "ACTIVE",
          dataClassification: DEMO_CLASSIFICATION,
        },
        create: {
          code: ExamTrackCode.LEGACY_UBE,
          name: "Legacy UBE",
          dataClassification: DEMO_CLASSIFICATION,
        },
      }),
      tx.examTrack.upsert({
        where: { code: ExamTrackCode.NEXTGEN_UBE },
        update: {
          name: "NextGen UBE",
          status: "ACTIVE",
          dataClassification: DEMO_CLASSIFICATION,
        },
        create: {
          code: ExamTrackCode.NEXTGEN_UBE,
          name: "NextGen UBE",
          dataClassification: DEMO_CLASSIFICATION,
        },
      }),
      tx.examTrack.upsert({
        where: { code: ExamTrackCode.STATE_SPECIFIC },
        update: {
          name: "State Specific",
          status: "ACTIVE",
          dataClassification: DEMO_CLASSIFICATION,
        },
        create: {
          code: ExamTrackCode.STATE_SPECIFIC,
          name: "State Specific",
          dataClassification: DEMO_CLASSIFICATION,
        },
      }),
    ]);

    const legacyExamVersion = await tx.jurisdictionExamVersion.upsert({
      where: {
        jurisdiction_examTrackId_effectiveFrom: {
          jurisdiction: "UBE",
          examTrackId: legacyTrack.id,
          effectiveFrom: LEGACY_EFFECTIVE_FROM,
        },
      },
      update: {
        versionLabel: "Legacy UBE through February 2028",
        effectiveTo: LEGACY_EFFECTIVE_TO,
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        jurisdiction: "UBE",
        examTrackId: legacyTrack.id,
        versionLabel: "Legacy UBE through February 2028",
        effectiveFrom: LEGACY_EFFECTIVE_FROM,
        effectiveTo: LEGACY_EFFECTIVE_TO,
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    await tx.jurisdictionExamVersion.upsert({
      where: {
        jurisdiction_examTrackId_effectiveFrom: {
          jurisdiction: "NEXTGEN",
          examTrackId: nextGenTrack.id,
          effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        },
      },
      update: {
        versionLabel: "NextGen UBE beginning July 2026",
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        jurisdiction: "NEXTGEN",
        examTrackId: nextGenTrack.id,
        versionLabel: "NextGen UBE beginning July 2026",
        effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    await tx.simulationBlueprint.upsert({
      where: {
        key_version: {
          key: "demo-nextgen-july-2026",
          version: 1,
        },
      },
      update: {
        label: "DEMO_NOT_FOR_PUBLICATION NextGen July 2026 blueprint",
        administrationDate: JULY_2026_EFFECTIVE_FROM,
        blueprint: {
          itemTypes: [
            "SELECT_TWO",
            "SHORT_ANSWER",
            "MEDIUM_ANSWER",
            "INTEGRATED_SET",
            "STANDARD_PERFORMANCE_TASK",
            "LEGAL_RESEARCH_PERFORMANCE_TASK",
          ],
          scoringScale: "NEXTGEN_POINTS",
          note: DEMO_CLASSIFICATION,
        },
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        key: "demo-nextgen-july-2026",
        examTrackId: nextGenTrack.id,
        administrationDate: JULY_2026_EFFECTIVE_FROM,
        version: 1,
        label: "DEMO_NOT_FOR_PUBLICATION NextGen July 2026 blueprint",
        blueprint: {
          itemTypes: [
            "SELECT_TWO",
            "SHORT_ANSWER",
            "MEDIUM_ANSWER",
            "INTEGRATED_SET",
            "STANDARD_PERFORMANCE_TASK",
            "LEGAL_RESEARCH_PERFORMANCE_TASK",
          ],
          scoringScale: "NEXTGEN_POINTS",
          note: DEMO_CLASSIFICATION,
        },
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    await tx.jurisdictionExamVersion.upsert({
      where: {
        jurisdiction_examTrackId_effectiveFrom: {
          jurisdiction: "DEMO_STATE",
          examTrackId: stateSpecificTrack.id,
          effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        },
      },
      update: {
        versionLabel: "Demo state-specific configuration",
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        jurisdiction: "DEMO_STATE",
        examTrackId: stateSpecificTrack.id,
        versionLabel: "Demo state-specific configuration",
        effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    const admin = await tx.user.upsert({
      where: { email: DEVELOPMENT_USERS.admin.email },
      update: {
        name: DEVELOPMENT_USERS.admin.displayName,
        displayName: DEVELOPMENT_USERS.admin.displayName,
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        email: DEVELOPMENT_USERS.admin.email,
        name: DEVELOPMENT_USERS.admin.displayName,
        displayName: DEVELOPMENT_USERS.admin.displayName,
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    const learner = await tx.user.upsert({
      where: { email: DEVELOPMENT_USERS.learner.email },
      update: {
        name: DEVELOPMENT_USERS.learner.displayName,
        displayName: DEVELOPMENT_USERS.learner.displayName,
        status: "ACTIVE",
        dataClassification: DEMO_CLASSIFICATION,
      },
      create: {
        email: DEVELOPMENT_USERS.learner.email,
        name: DEVELOPMENT_USERS.learner.displayName,
        displayName: DEVELOPMENT_USERS.learner.displayName,
        dataClassification: DEMO_CLASSIFICATION,
      },
    });

    await Promise.all([
      tx.userRole.upsert({
        where: { userId_role: { userId: admin.id, role: UserRoleCode.ADMIN } },
        update: { status: "ACTIVE" },
        create: { userId: admin.id, role: UserRoleCode.ADMIN },
      }),
      tx.userRole.upsert({
        where: {
          userId_role: { userId: learner.id, role: UserRoleCode.STUDENT },
        },
        update: { status: "ACTIVE" },
        create: { userId: learner.id, role: UserRoleCode.STUDENT },
      }),
      tx.learnerProfile.upsert({
        where: { userId: learner.id },
        update: {
          targetJurisdiction: "UBE",
          targetExamDate: JULY_2026_EFFECTIVE_FROM,
          selectedExamVersionId: legacyExamVersion.id,
          status: "ACTIVE",
          dataClassification: DEMO_CLASSIFICATION,
        },
        create: {
          userId: learner.id,
          targetJurisdiction: "UBE",
          targetExamDate: JULY_2026_EFFECTIVE_FROM,
          selectedExamVersionId: legacyExamVersion.id,
          dataClassification: DEMO_CLASSIFICATION,
        },
      }),
    ]);

    for (const [subjectIndex, subject] of MBE_SUBJECTS.entries()) {
      const subjectNode = await upsertTaxonomyNode(tx, {
        key: `mbe.subject.${slugifyLabel(subject)}`,
        name: subject,
        nodeType: TaxonomyNodeType.SUBJECT,
        examTrackId: legacyTrack.id,
        effectiveFrom: LEGACY_EFFECTIVE_FROM,
        sortOrder: subjectIndex + 1,
      });

      const categories = MBE_CATEGORIES_BY_SUBJECT[subject];
      for (const [categoryIndex, category] of categories.entries()) {
        await upsertTaxonomyNode(tx, {
          key: `mbe.category.${slugifyLabel(subject)}.${slugifyLabel(category)}`,
          name: category,
          nodeType: TaxonomyNodeType.CATEGORY,
          parentId: subjectNode.id,
          examTrackId: legacyTrack.id,
          effectiveFrom: LEGACY_EFFECTIVE_FROM,
          sortOrder: categoryIndex + 1,
        });
      }
    }

    for (const [
      subjectIndex,
      subject,
    ] of LEGACY_MEE_SUBJECTS_BEGINNING_JULY_2026.entries()) {
      await upsertTaxonomyNode(tx, {
        key: `mee.legacy.subject.${slugifyLabel(subject)}`,
        name: subject,
        nodeType: TaxonomyNodeType.SUBJECT,
        examTrackId: legacyTrack.id,
        effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        sortOrder: subjectIndex + 1,
      });
    }

    for (const [
      skillIndex,
      skillLabel,
    ] of NEXTGEN_SKILL_CATEGORY_LABELS.entries()) {
      await upsertTaxonomyNode(tx, {
        key: `nextgen.skill.${String(skillIndex + 1).padStart(2, "0")}`,
        name: skillLabel,
        nodeType: TaxonomyNodeType.SKILL,
        examTrackId: nextGenTrack.id,
        effectiveFrom: JULY_2026_EFFECTIVE_FROM,
        sortOrder: skillIndex + 1,
      });
    }
  }, { timeout: 30_000 });
}

type TaxonomyWriter = Pick<PrismaClient, "taxonomyNode">;

async function upsertTaxonomyNode(
  tx: TaxonomyWriter,
  input: {
    key: string;
    name: string;
    nodeType: TaxonomyNodeType;
    effectiveFrom: Date;
    sortOrder: number;
    parentId?: string;
    examTrackId?: string;
  },
) {
  return tx.taxonomyNode.upsert({
    where: {
      key_effectiveFrom: {
        key: input.key,
        effectiveFrom: input.effectiveFrom,
      },
    },
    update: {
      name: input.name,
      slug: slugifyLabel(input.name),
      nodeType: input.nodeType,
      parentId: input.parentId,
      examTrackId: input.examTrackId,
      sortOrder: input.sortOrder,
      status: "ACTIVE",
      dataClassification: DEMO_CLASSIFICATION,
    },
    create: {
      key: input.key,
      slug: slugifyLabel(input.name),
      name: input.name,
      nodeType: input.nodeType,
      parentId: input.parentId,
      examTrackId: input.examTrackId,
      effectiveFrom: input.effectiveFrom,
      sortOrder: input.sortOrder,
      dataClassification: DEMO_CLASSIFICATION,
    },
  });
}

main()
  .then(async () => {
    console.log("Seed data applied.");
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Seed data failed.");
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
