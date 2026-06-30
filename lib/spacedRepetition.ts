import type { FlashcardProgress, FlashcardRating } from "@/lib/types";

const minimumEaseFactor = 1.3;
const defaultEaseFactor = 2.5;
const needsWorkDelayMinutes = 10;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function qualityForRating(rating: FlashcardRating) {
  return rating === "got-it" ? 5 : 2;
}

function nextEaseFactor(easeFactor: number, quality: number) {
  const adjusted = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(minimumEaseFactor, Number(adjusted.toFixed(2)));
}

export function applySpacedRepetition(
  existing: FlashcardProgress | undefined,
  rating: FlashcardRating,
  now = new Date()
) {
  const quality = qualityForRating(rating);
  const previousEaseFactor = existing?.easeFactor || defaultEaseFactor;
  const easeFactor = nextEaseFactor(previousEaseFactor, quality);
  const previousRepetitions = existing?.repetitions || 0;
  const previousIntervalDays = existing?.intervalDays || 0;

  if (rating === "needs-work") {
    return {
      easeFactor,
      intervalDays: 0,
      repetitions: 0,
      lapses: (existing?.lapses || 0) + 1,
      nextReviewAt: addMinutes(now, needsWorkDelayMinutes).toISOString()
    };
  }

  const repetitions = previousRepetitions + 1;
  let intervalDays = 1;

  if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.max(1, Math.round(previousIntervalDays * easeFactor));
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses: existing?.lapses || 0,
    nextReviewAt: addDays(now, intervalDays).toISOString()
  };
}

export function isFlashcardDue(progress: FlashcardProgress | undefined, now = new Date()) {
  if (!progress?.nextReviewAt) {
    return true;
  }

  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function dueLabel(progress: FlashcardProgress | undefined, now = new Date()) {
  if (!progress?.nextReviewAt) {
    return "Due now";
  }

  const dueAt = new Date(progress.nextReviewAt);
  const diffMs = dueAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Due now";
  }

  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMinutes < 60) {
    return `Due in ${diffMinutes} min`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);

  if (diffHours < 24) {
    return `Due in ${diffHours} hr`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}
