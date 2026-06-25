import { handleDevelopmentDatabaseFallback } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

import type {
  DayOfWeek,
  OnboardingSettings,
  PreferredTextSize,
} from "@/domain/onboarding";
import {
  getProfileFromMemory,
  saveProfileInMemory,
  type SavedLearnerProfile,
} from "@/domain/onboarding-store";

export async function saveLearnerOnboarding(
  userId: string,
  settings: OnboardingSettings,
) {
  try {
    const profile = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {
        targetJurisdiction: settings.jurisdiction,
        targetExamDate: settings.examDate,
        selectedExamVersionId: settings.selectedExamVersionId.startsWith("dev-")
          ? null
          : settings.selectedExamVersionId,
        resolvedTrackConfirmed: settings.resolvedTrackConfirmed,
        firstTimeTaker: settings.firstTimeTaker,
        timeZone: settings.timeZone,
        studyStartDate: settings.studyStartDate,
        availableDays: settings.availableDays,
        availableMinutesByDay: settings.availableMinutesByDay,
        restDay: settings.restDay,
        extendedTimeMultiplier: settings.extendedTimeMultiplier,
        preferredTextSize: settings.preferredTextSize,
        highContrastPreference: settings.highContrastPreference,
        reducedMotionPreference: settings.reducedMotionPreference,
        onboardingCompletedAt: new Date(),
        status: "ACTIVE",
      },
      create: {
        userId,
        targetJurisdiction: settings.jurisdiction,
        targetExamDate: settings.examDate,
        selectedExamVersionId: settings.selectedExamVersionId.startsWith("dev-")
          ? null
          : settings.selectedExamVersionId,
        resolvedTrackConfirmed: settings.resolvedTrackConfirmed,
        firstTimeTaker: settings.firstTimeTaker,
        timeZone: settings.timeZone,
        studyStartDate: settings.studyStartDate,
        availableDays: settings.availableDays,
        availableMinutesByDay: settings.availableMinutesByDay,
        restDay: settings.restDay,
        extendedTimeMultiplier: settings.extendedTimeMultiplier,
        preferredTextSize: settings.preferredTextSize,
        highContrastPreference: settings.highContrastPreference,
        reducedMotionPreference: settings.reducedMotionPreference,
        onboardingCompletedAt: new Date(),
      },
    });

    return mapProfile(profile, settings.resolvedExamTrackCode);
  } catch (error) {
    handleDevelopmentDatabaseFallback({
      area: "onboarding.saveLearnerOnboarding",
      error,
    });
    return saveProfileInMemory(userId, settings);
  }
}

export async function getLearnerProfile(userId: string) {
  try {
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      include: {
        selectedExamVersion: {
          include: { examTrack: true },
        },
      },
    });

    if (!profile) {
      return null;
    }

    return mapProfile(
      profile,
      profile.selectedExamVersion?.examTrack.code ?? null,
    );
  } catch (error) {
    handleDevelopmentDatabaseFallback({
      area: "onboarding.getLearnerProfile",
      error,
    });
    return getProfileFromMemory(userId);
  }
}

type PrismaLearnerProfile = Awaited<
  ReturnType<typeof prisma.learnerProfile.upsert>
>;

function mapProfile(
  profile: PrismaLearnerProfile,
  resolvedExamTrackCode: SavedLearnerProfile["resolvedExamTrackCode"],
): SavedLearnerProfile {
  return {
    userId: profile.userId,
    jurisdiction: profile.targetJurisdiction,
    examDate: profile.targetExamDate,
    selectedExamVersionId: profile.selectedExamVersionId,
    resolvedExamTrackCode,
    resolvedTrackConfirmed: profile.resolvedTrackConfirmed,
    firstTimeTaker: profile.firstTimeTaker,
    timeZone: profile.timeZone,
    studyStartDate: profile.studyStartDate,
    availableDays: profile.availableDays as DayOfWeek[],
    availableMinutesByDay: profile.availableMinutesByDay as Record<
      DayOfWeek,
      number
    > | null,
    restDay: profile.restDay as DayOfWeek | null,
    extendedTimeMultiplier: profile.extendedTimeMultiplier,
    preferredTextSize: profile.preferredTextSize as PreferredTextSize,
    highContrastPreference: profile.highContrastPreference,
    reducedMotionPreference: profile.reducedMotionPreference,
    onboardingCompletedAt: profile.onboardingCompletedAt,
  };
}
