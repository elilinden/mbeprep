export type RuleVersionStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "RETIRED"
  | "ARCHIVED";

export type RuleVersionRecord = {
  id: string;
  ruleId: string;
  version: number;
  status: RuleVersionStatus;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
};

export function resolveActiveRuleVersion(
  versions: readonly RuleVersionRecord[],
  ruleId: string,
  asOf: Date,
) {
  const candidates = versions
    .filter(
      (version) =>
        version.ruleId === ruleId &&
        version.status === "PUBLISHED" &&
        version.effectiveFrom.getTime() <= asOf.getTime() &&
        (version.effectiveTo == null ||
          version.effectiveTo.getTime() >= asOf.getTime()),
    )
    .sort(
      (a, b) =>
        b.effectiveFrom.getTime() - a.effectiveFrom.getTime() ||
        b.version - a.version,
    );

  return candidates[0] ?? null;
}
