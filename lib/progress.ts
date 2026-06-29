"use client";

import { buildDashboardStats, calculateWeakAreas } from "@/lib/scoring";
import { clearStorage, emptyProgress, readStorage, writeStorage } from "@/lib/storage";
import type { Attempt, UserProgress } from "@/lib/types";

export function getProgress(): UserProgress {
  return readStorage();
}

export function saveAttempt(attempt: Attempt): UserProgress {
  const progress = readStorage();
  const existing = progress.questionStats[attempt.questionId] || {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    savedForReview: false,
    guessed: 0,
    confusing: 0,
    totalTime: 0
  };

  const next: UserProgress = {
    ...progress,
    attempts: [...progress.attempts, attempt],
    questionStats: {
      ...progress.questionStats,
      [attempt.questionId]: {
        ...existing,
        attempts: existing.attempts + 1,
        correct: existing.correct + (attempt.isCorrect ? 1 : 0),
        incorrect: existing.incorrect + (attempt.isCorrect ? 0 : 1),
        guessed: existing.guessed + (attempt.guessed ? 1 : 0),
        confusing: existing.confusing + (attempt.markedConfusing ? 1 : 0),
        totalTime: existing.totalTime + attempt.timeSpent,
        lastAttemptAt: attempt.timestamp
      }
    }
  };

  writeStorage(next);
  return next;
}

export function updateQuestionStats(questionId: string, savedForReview: boolean): UserProgress {
  const progress = readStorage();
  const existing = progress.questionStats[questionId] || {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    savedForReview,
    guessed: 0,
    confusing: 0,
    totalTime: 0
  };

  const savedQuestionIds = savedForReview
    ? Array.from(new Set([...progress.savedQuestionIds, questionId]))
    : progress.savedQuestionIds.filter((id) => id !== questionId);

  const next = {
    ...progress,
    savedQuestionIds,
    questionStats: {
      ...progress.questionStats,
      [questionId]: {
        ...existing,
        savedForReview
      }
    }
  };

  writeStorage(next);
  return next;
}

export function getDashboardStats() {
  return buildDashboardStats(readStorage());
}

export function getWeakAreas() {
  return calculateWeakAreas(readStorage());
}

export function resetProgress() {
  clearStorage();
  return emptyProgress;
}
