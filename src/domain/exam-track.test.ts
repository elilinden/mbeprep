import { describe, expect, it } from "vitest";

import { resolveExamTrack, type ExamVersionConfig } from "./exam-track";

const configs: ExamVersionConfig[] = [
  {
    id: "legacy",
    jurisdiction: "UBE",
    examTrackCode: "LEGACY_UBE",
    effectiveFrom: new Date("2011-01-01T00:00:00.000Z"),
    effectiveTo: new Date("2028-02-29T23:59:59.999Z"),
    status: "ACTIVE",
  },
  {
    id: "nextgen",
    jurisdiction: "NG",
    examTrackCode: "NEXTGEN_UBE",
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    status: "ACTIVE",
  },
  {
    id: "inactive",
    jurisdiction: "UBE",
    examTrackCode: "STATE_SPECIFIC",
    effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
    status: "INACTIVE",
  },
];

describe("resolveExamTrack", () => {
  it("selects an active configuration by jurisdiction and exam date", () => {
    expect(
      resolveExamTrack(configs, "ube", new Date("2026-07-28T00:00:00.000Z"))
        ?.examTrackCode,
    ).toBe("LEGACY_UBE");
  });

  it("does not return inactive or out-of-window configurations", () => {
    expect(
      resolveExamTrack(configs, "UBE", new Date("2029-07-01T00:00:00.000Z")),
    ).toBeNull();
  });

  it("uses the most recent matching effective date when versions overlap", () => {
    const overlapping = [
      ...configs,
      {
        id: "newer",
        jurisdiction: "UBE",
        examTrackCode: "STATE_SPECIFIC" as const,
        effectiveFrom: new Date("2027-01-01T00:00:00.000Z"),
        status: "ACTIVE" as const,
      },
    ];

    expect(
      resolveExamTrack(overlapping, "UBE", new Date("2027-02-01T00:00:00.000Z"))
        ?.id,
    ).toBe("newer");
  });
});
