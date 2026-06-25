import { describe, expect, it } from "vitest";

import { clearInMemoryProfiles } from "@/domain/onboarding-store";

import {
  getLearnerProfile,
  saveLearnerOnboarding,
} from "./onboarding-repository";

describe("onboarding persistence", () => {
  it("saves and reads onboarding settings", async () => {
    clearInMemoryProfiles();

    await saveLearnerOnboarding("test-user", {
      jurisdiction: "UBE",
      examDate: new Date("2026-07-28T00:00:00.000Z"),
      selectedExamVersionId: "dev-legacy-ube",
      resolvedExamTrackCode: "LEGACY_UBE",
      resolvedTrackConfirmed: true,
      firstTimeTaker: true,
      timeZone: "America/Los_Angeles",
      studyStartDate: new Date("2026-06-24T00:00:00.000Z"),
      availableDays: ["Monday", "Wednesday"],
      availableMinutesByDay: {
        Monday: 45,
        Tuesday: 0,
        Wednesday: 45,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
      },
      restDay: "Sunday",
      extendedTimeMultiplier: 1.5,
      preferredTextSize: "MEDIUM",
      highContrastPreference: true,
      reducedMotionPreference: false,
    });

    const profile = await getLearnerProfile("test-user");

    expect(profile?.jurisdiction).toBe("UBE");
    expect(profile?.resolvedTrackConfirmed).toBe(true);
    expect(profile?.availableMinutesByDay?.Monday).toBe(45);
    expect(profile?.highContrastPreference).toBe(true);
  });
});
