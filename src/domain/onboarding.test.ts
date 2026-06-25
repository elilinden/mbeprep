import { describe, expect, it } from "vitest";

import type { ExamVersionConfig } from "./exam-track";
import {
  getTodayAvailableMinutes,
  parseOnboardingForm,
  resolveTrackForOnboarding,
} from "./onboarding";

const limits = {
  minExtendedTimeMultiplier: 1,
  maxExtendedTimeMultiplier: 2,
  today: new Date("2026-06-24T00:00:00.000Z"),
};

describe("onboarding validation", () => {
  it("rejects past exam dates", () => {
    const formData = validFormData();
    formData.set("examDate", "2026-06-01");

    expect(() => parseOnboardingForm(formData, limits)).toThrow();
  });

  it("rejects negative available minutes", () => {
    const formData = validFormData();
    formData.set("minutes-Monday", "-1");

    expect(() => parseOnboardingForm(formData, limits)).toThrow();
  });

  it("rejects unsafe extended-time multipliers", () => {
    const formData = validFormData();
    formData.set("extendedTimeMultiplier", "3");

    expect(() => parseOnboardingForm(formData, limits)).toThrow();
  });

  it("computes today's available minutes in the learner time zone", () => {
    expect(
      getTodayAvailableMinutes(
        {
          Monday: 10,
          Tuesday: 20,
          Wednesday: 30,
          Thursday: 40,
          Friday: 50,
          Saturday: 60,
          Sunday: 0,
        },
        "America/Los_Angeles",
        new Date("2026-06-24T12:00:00.000Z"),
      ),
    ).toBe(30);
  });
});

describe("onboarding exam-track resolution", () => {
  const configs: ExamVersionConfig[] = [
    {
      id: "legacy",
      jurisdiction: "UBE",
      examTrackCode: "LEGACY_UBE",
      effectiveFrom: new Date("2011-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2028-02-29T23:59:59.999Z"),
      status: "ACTIVE",
    },
  ];

  it("returns a plain-language explanation", () => {
    expect(
      resolveTrackForOnboarding(
        configs,
        "ube",
        new Date("2026-07-28T00:00:00.000Z"),
      )?.explanation,
    ).toContain("legacy UBE");
  });
});

function validFormData() {
  const formData = new FormData();
  formData.set("jurisdiction", "UBE");
  formData.set("examDate", "2026-07-28");
  formData.set("selectedExamVersionId", "dev-legacy-ube");
  formData.set("resolvedExamTrackCode", "LEGACY_UBE");
  formData.set("resolvedTrackConfirmed", "on");
  formData.set("firstTimeTaker", "first-time");
  formData.set("timeZone", "America/Los_Angeles");
  formData.set("studyStartDate", "2026-06-24");
  formData.set("availableDays", "Monday");
  formData.set("restDay", "Sunday");
  formData.set("extendedTimeMultiplier", "1.5");
  formData.set("preferredTextSize", "MEDIUM");

  for (const day of [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]) {
    formData.set(`minutes-${day}`, "30");
  }

  return formData;
}
