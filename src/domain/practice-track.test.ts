import { describe, expect, it } from "vitest";

import {
  normalizeExamTrack,
  resolveLearnerPracticeExamTrack,
} from "./practice-track";

describe("learner practice exam-track resolution", () => {
  it("defaults ordinary practice to the learner's resolved exam track", () => {
    expect(
      resolveLearnerPracticeExamTrack({
        learnerExamTrack: "LEGACY_UBE",
        requestedExamTrack: null,
      }),
    ).toEqual({ examTrack: "LEGACY_UBE" });

    expect(
      resolveLearnerPracticeExamTrack({
        learnerExamTrack: "NEXTGEN_UBE",
        requestedExamTrack: "",
      }),
    ).toEqual({ examTrack: "NEXTGEN_UBE" });
  });

  it("normalizes incompatible learner requests back to the profile track", () => {
    expect(
      resolveLearnerPracticeExamTrack({
        learnerExamTrack: "LEGACY_UBE",
        requestedExamTrack: "NEXTGEN_UBE",
      }),
    ).toEqual({
      examTrack: "LEGACY_UBE",
      normalizedFrom: "NEXTGEN_UBE",
    });
  });

  it("rejects unsupported exam-track values", () => {
    expect(() => normalizeExamTrack("OFFICIAL_SAMPLE_BANK")).toThrow(
      "Requested exam track is not supported.",
    );
  });
});
