import { describe, expect, it } from "vitest";

import {
  DEMO_LABEL,
  assertDemoFixtureLabel,
  canReleaseReviewContent,
} from "./content-policy";

describe("content policy", () => {
  it("blocks review content before submission", () => {
    expect(canReleaseReviewContent("before-submission")).toBe(false);
  });

  it("allows review content after submission", () => {
    expect(canReleaseReviewContent("after-submission")).toBe(true);
  });

  it("requires demo fixtures to carry the publication warning label", () => {
    expect(() => assertDemoFixtureLabel(DEMO_LABEL)).not.toThrow();
    expect(() => assertDemoFixtureLabel("demo")).toThrow(DEMO_LABEL);
  });
});
