import { describe, expect, it } from "vitest";

import {
  resolveActiveRuleVersion,
  type RuleVersionRecord,
} from "./rule-version";

const versions: RuleVersionRecord[] = [
  {
    id: "draft",
    ruleId: "rule-a",
    version: 1,
    status: "DRAFT",
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "published-old",
    ruleId: "rule-a",
    version: 2,
    status: "PUBLISHED",
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    effectiveTo: new Date("2026-06-30T23:59:59.999Z"),
  },
  {
    id: "published-active",
    ruleId: "rule-a",
    version: 3,
    status: "PUBLISHED",
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
  },
];

describe("resolveActiveRuleVersion", () => {
  it("returns the published version active on the requested date", () => {
    expect(
      resolveActiveRuleVersion(
        versions,
        "rule-a",
        new Date("2026-07-02T00:00:00.000Z"),
      )?.id,
    ).toBe("published-active");
  });

  it("ignores drafts and inactive windows", () => {
    expect(
      resolveActiveRuleVersion(
        versions,
        "rule-a",
        new Date("2024-01-01T00:00:00.000Z"),
      ),
    ).toBeNull();
  });
});
