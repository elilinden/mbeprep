import { beforeEach, describe, expect, it } from "vitest";

import {
  resetEssayMemoryStoreForTests,
  startEssayAttemptForUser,
} from "./essay-memory-store";

describe("essay attempt creation", () => {
  beforeEach(() => {
    resetEssayMemoryStoreForTests();
  });

  it("reuses the first attempt for duplicate start submissions", () => {
    const first = startEssayAttemptForUser({
      userId: "dev-learner",
      essayVersionId: "demo-essay-1",
      extendedTimeMultiplier: 1,
      idempotencyKey: "same-start",
    });
    const second = startEssayAttemptForUser({
      userId: "dev-learner",
      essayVersionId: "demo-essay-1",
      extendedTimeMultiplier: 1,
      idempotencyKey: "same-start",
    });

    expect(second.id).toBe(first.id);
  });
});
