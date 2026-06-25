import { z } from "zod";

import type { ExamTrackCode, ExamVersionConfig } from "./exam-track";
import { resolveExamTrack } from "./exam-track";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TEXT_SIZE_OPTIONS = [
  "SMALL",
  "MEDIUM",
  "LARGE",
  "EXTRA_LARGE",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type PreferredTextSize = (typeof TEXT_SIZE_OPTIONS)[number];

export type OnboardingSettings = {
  jurisdiction: string;
  examDate: Date;
  selectedExamVersionId: string;
  resolvedExamTrackCode: ExamTrackCode;
  resolvedTrackConfirmed: boolean;
  firstTimeTaker: boolean;
  timeZone: string;
  studyStartDate: Date;
  availableDays: DayOfWeek[];
  availableMinutesByDay: Record<DayOfWeek, number>;
  restDay?: DayOfWeek;
  extendedTimeMultiplier: number;
  preferredTextSize: PreferredTextSize;
  highContrastPreference: boolean;
  reducedMotionPreference: boolean;
};

export type OnboardingLimits = {
  minExtendedTimeMultiplier: number;
  maxExtendedTimeMultiplier: number;
  today: Date;
};

export type ResolvedExamTrack = ExamVersionConfig & {
  explanation: string;
};

export function resolveTrackForOnboarding(
  configs: readonly ExamVersionConfig[],
  jurisdiction: string,
  examDate: Date,
): ResolvedExamTrack | null {
  const resolved = resolveExamTrack(configs, jurisdiction, examDate);

  if (!resolved) {
    return null;
  }

  return {
    ...resolved,
    explanation: explainResolvedTrack(
      resolved.examTrackCode,
      jurisdiction,
      examDate,
    ),
  };
}

export function explainResolvedTrack(
  trackCode: ExamTrackCode,
  jurisdiction: string,
  examDate: Date,
) {
  const formattedDate = examDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const normalizedJurisdiction = jurisdiction.trim().toUpperCase();

  if (trackCode === "LEGACY_UBE") {
    return `${normalizedJurisdiction} is configured for the legacy UBE on ${formattedDate}.`;
  }

  if (trackCode === "NEXTGEN_UBE") {
    return `${normalizedJurisdiction} is configured for the NextGen UBE on ${formattedDate}.`;
  }

  return `${normalizedJurisdiction} is configured for a state-specific exam track on ${formattedDate}.`;
}

export function parseOnboardingForm(
  formData: FormData,
  limits: OnboardingLimits,
) {
  const availableMinutesByDay = Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [
      day,
      Number(formData.get(`minutes-${day}`) ?? 0),
    ]),
  );

  const raw = {
    jurisdiction: formData.get("jurisdiction"),
    examDate: formData.get("examDate"),
    selectedExamVersionId: formData.get("selectedExamVersionId"),
    resolvedExamTrackCode: formData.get("resolvedExamTrackCode"),
    resolvedTrackConfirmed: formData.get("resolvedTrackConfirmed") === "on",
    firstTimeTaker: formData.get("firstTimeTaker") === "first-time",
    timeZone: formData.get("timeZone"),
    studyStartDate: formData.get("studyStartDate"),
    availableDays: formData.getAll("availableDays"),
    availableMinutesByDay,
    restDay: formData.get("restDay") || undefined,
    extendedTimeMultiplier: Number(formData.get("extendedTimeMultiplier") ?? 1),
    preferredTextSize: formData.get("preferredTextSize"),
    highContrastPreference: formData.get("highContrastPreference") === "on",
    reducedMotionPreference: formData.get("reducedMotionPreference") === "on",
  };

  return onboardingSchema(limits).parse(raw);
}

export function getTodayAvailableMinutes(
  availableMinutesByDay: Partial<Record<DayOfWeek, number>> | null | undefined,
  timeZone: string | null | undefined,
  now = new Date(),
) {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timeZone || "UTC",
  }).format(now) as DayOfWeek;

  return Math.max(0, availableMinutesByDay?.[day] ?? 0);
}

function onboardingSchema(limits: OnboardingLimits) {
  const todayAtStart = toDateOnly(limits.today);

  return z
    .object({
      jurisdiction: z
        .string()
        .trim()
        .min(2)
        .max(32)
        .transform((value) => value.toUpperCase()),
      examDate: z.coerce.date().refine((date) => date >= todayAtStart, {
        message: "Exam date cannot be in the past.",
      }),
      selectedExamVersionId: z.string().min(1),
      resolvedExamTrackCode: z.enum([
        "LEGACY_UBE",
        "NEXTGEN_UBE",
        "STATE_SPECIFIC",
      ]),
      resolvedTrackConfirmed: z.literal(true, {
        error: "Confirm the resolved exam track before continuing.",
      }),
      firstTimeTaker: z.boolean(),
      timeZone: z.string().trim().min(1).max(80),
      studyStartDate: z.coerce.date(),
      availableDays: z
        .array(z.enum(DAYS_OF_WEEK))
        .min(1, "Select at least one available study day."),
      availableMinutesByDay: z.record(
        z.enum(DAYS_OF_WEEK),
        z.number().min(0, "Available minutes cannot be negative."),
      ),
      restDay: z.enum(DAYS_OF_WEEK).optional(),
      extendedTimeMultiplier: z
        .number()
        .min(limits.minExtendedTimeMultiplier)
        .max(limits.maxExtendedTimeMultiplier),
      preferredTextSize: z.enum(TEXT_SIZE_OPTIONS),
      highContrastPreference: z.boolean(),
      reducedMotionPreference: z.boolean(),
    })
    .refine((value) => value.studyStartDate <= value.examDate, {
      message: "Study start date must be on or before the exam date.",
      path: ["studyStartDate"],
    });
}

function toDateOnly(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
