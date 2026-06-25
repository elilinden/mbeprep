import type { ExamVersionConfig } from "./exam-track";
import type {
  DayOfWeek,
  OnboardingSettings,
  PreferredTextSize,
} from "./onboarding";

export type SavedLearnerProfile = {
  userId: string;
  jurisdiction: string | null;
  examDate: Date | null;
  selectedExamVersionId: string | null;
  resolvedExamTrackCode: ExamVersionConfig["examTrackCode"] | null;
  resolvedTrackConfirmed: boolean;
  firstTimeTaker: boolean | null;
  timeZone: string | null;
  studyStartDate: Date | null;
  availableDays: DayOfWeek[];
  availableMinutesByDay: Record<DayOfWeek, number> | null;
  restDay: DayOfWeek | null;
  extendedTimeMultiplier: number | null;
  preferredTextSize: PreferredTextSize;
  highContrastPreference: boolean;
  reducedMotionPreference: boolean;
  onboardingCompletedAt: Date | null;
};

const profileStore = new Map<string, SavedLearnerProfile>();

export function saveProfileInMemory(
  userId: string,
  settings: OnboardingSettings,
) {
  const profile: SavedLearnerProfile = {
    userId,
    jurisdiction: settings.jurisdiction,
    examDate: settings.examDate,
    selectedExamVersionId: settings.selectedExamVersionId,
    resolvedExamTrackCode: settings.resolvedExamTrackCode,
    resolvedTrackConfirmed: settings.resolvedTrackConfirmed,
    firstTimeTaker: settings.firstTimeTaker,
    timeZone: settings.timeZone,
    studyStartDate: settings.studyStartDate,
    availableDays: settings.availableDays,
    availableMinutesByDay: settings.availableMinutesByDay,
    restDay: settings.restDay ?? null,
    extendedTimeMultiplier: settings.extendedTimeMultiplier,
    preferredTextSize: settings.preferredTextSize,
    highContrastPreference: settings.highContrastPreference,
    reducedMotionPreference: settings.reducedMotionPreference,
    onboardingCompletedAt: new Date(),
  };

  profileStore.set(userId, profile);
  return profile;
}

export function getProfileFromMemory(userId: string) {
  return profileStore.get(userId) ?? null;
}

export function clearInMemoryProfiles() {
  profileStore.clear();
}
