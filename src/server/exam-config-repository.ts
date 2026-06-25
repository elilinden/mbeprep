import { handleDevelopmentDatabaseFallback } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

import type { ExamVersionConfig } from "@/domain/exam-track";

const fallbackExamVersions: ExamVersionConfig[] = [
  {
    id: "dev-legacy-ube",
    jurisdiction: "UBE",
    examTrackCode: "LEGACY_UBE",
    effectiveFrom: new Date("2011-01-01T00:00:00.000Z"),
    effectiveTo: new Date("2028-02-29T23:59:59.999Z"),
    status: "ACTIVE",
  },
  {
    id: "dev-nextgen-ube",
    jurisdiction: "NEXTGEN",
    examTrackCode: "NEXTGEN_UBE",
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    status: "ACTIVE",
  },
  {
    id: "dev-state-specific",
    jurisdiction: "DEMO_STATE",
    examTrackCode: "STATE_SPECIFIC",
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    status: "ACTIVE",
  },
];

export async function listExamVersionConfigs() {
  try {
    const versions = await prisma.jurisdictionExamVersion.findMany({
      where: { status: "ACTIVE" },
      include: { examTrack: true },
      orderBy: [{ jurisdiction: "asc" }, { effectiveFrom: "desc" }],
    });

    return versions.map(
      (version): ExamVersionConfig => ({
        id: version.id,
        jurisdiction: version.jurisdiction,
        examTrackCode: version.examTrack.code,
        effectiveFrom: version.effectiveFrom,
        effectiveTo: version.effectiveTo,
        status: version.status,
      }),
    );
  } catch (error) {
    handleDevelopmentDatabaseFallback({
      area: "examConfig.listExamVersionConfigs",
      error,
    });
    return fallbackExamVersions;
  }
}
