export type ExamTrackCode = "LEGACY_UBE" | "NEXTGEN_UBE" | "STATE_SPECIFIC";

export type ExamVersionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "RETIRED"
  | "ARCHIVED";

export type ExamVersionConfig = {
  id: string;
  jurisdiction: string;
  examTrackCode: ExamTrackCode;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status: ExamVersionStatus;
};

export function resolveExamTrack(
  configs: readonly ExamVersionConfig[],
  jurisdiction: string,
  examDate: Date,
) {
  const normalizedJurisdiction = normalizeJurisdiction(jurisdiction);
  const matchingConfigs = configs
    .filter(
      (config) =>
        config.status === "ACTIVE" &&
        normalizeJurisdiction(config.jurisdiction) === normalizedJurisdiction &&
        isWithinEffectiveWindow(config, examDate),
    )
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());

  return matchingConfigs[0] ?? null;
}

function normalizeJurisdiction(jurisdiction: string) {
  return jurisdiction.trim().toUpperCase();
}

function isWithinEffectiveWindow(config: ExamVersionConfig, examDate: Date) {
  const startsOnOrBefore = config.effectiveFrom.getTime() <= examDate.getTime();
  const endsAfter =
    config.effectiveTo == null ||
    config.effectiveTo.getTime() >= examDate.getTime();

  return startsOnOrBefore && endsAfter;
}
