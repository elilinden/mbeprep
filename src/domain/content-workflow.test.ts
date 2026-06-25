import { describe, expect, it } from "vitest";

import { canTransitionContent } from "./content-workflow";

describe("content workflow authorization", () => {
  it("allows editors to submit drafts for legal review", () => {
    expect(
      canTransitionContent({
        actor: { id: "editor-1", roles: ["EDITOR"] },
        currentStatus: "DRAFT",
        nextStatus: "LEGAL_REVIEW",
        authorId: "author-1",
        twoPersonReview: true,
      }),
    ).toBe(true);
  });

  it("blocks students from advancing content", () => {
    expect(
      canTransitionContent({
        actor: { id: "student-1", roles: ["STUDENT"] },
        currentStatus: "DRAFT",
        nextStatus: "LEGAL_REVIEW",
        authorId: "author-1",
        twoPersonReview: false,
      }),
    ).toBe(false);
  });

  it("enforces two-person review when configured", () => {
    expect(
      canTransitionContent({
        actor: { id: "author-1", roles: ["REVIEWER"] },
        currentStatus: "LEGAL_REVIEW",
        nextStatus: "EDITORIAL_REVIEW",
        authorId: "author-1",
        twoPersonReview: true,
      }),
    ).toBe(false);
  });

  it("requires admins to publish and retire", () => {
    expect(
      canTransitionContent({
        actor: { id: "admin-1", roles: ["ADMIN"] },
        currentStatus: "APPROVED",
        nextStatus: "PUBLISHED",
        twoPersonReview: true,
      }),
    ).toBe(true);
    expect(
      canTransitionContent({
        actor: { id: "editor-1", roles: ["EDITOR"] },
        currentStatus: "PUBLISHED",
        nextStatus: "RETIRED",
        twoPersonReview: true,
      }),
    ).toBe(false);
  });
});
