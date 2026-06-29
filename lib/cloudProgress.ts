"use client";

import { calculateWeakAreas } from "@/lib/scoring";
import { emptyProgress, readStorage, writeStorage } from "@/lib/storage";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { Attempt, QuestionStats, UserProgress } from "@/lib/types";

type SupabaseError = {
  code?: string;
  message?: string;
};

function isMissingTable(error: SupabaseError | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("schema cache");
}

function logCloudWarning(area: string, error: SupabaseError | null) {
  if (!error) {
    return;
  }

  if (isMissingTable(error)) {
    console.warn(`${area}: Supabase progress tables are not set up yet.`);
    return;
  }

  console.warn(`${area}: ${error.message || "Supabase sync failed."}`);
}

async function getCloudUser() {
  const supabase = getBrowserSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return { supabase, user: data.user };
}

function attemptKey(attempt: Attempt) {
  return [
    attempt.questionId,
    attempt.timestamp,
    attempt.selectedChoice,
    attempt.correctChoice
  ].join("|||");
}

function normalizeProgress(value: unknown): UserProgress {
  const progress = value as Partial<UserProgress> | null;

  if (!progress) {
    return emptyProgress;
  }

  return {
    attempts: Array.isArray(progress.attempts) ? progress.attempts as Attempt[] : [],
    questionStats: progress.questionStats && typeof progress.questionStats === "object"
      ? progress.questionStats as Record<string, QuestionStats>
      : {},
    savedQuestionIds: Array.isArray(progress.savedQuestionIds) ? progress.savedQuestionIds as string[] : []
  };
}

function mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
  const attemptsByKey = new Map<string, Attempt>();

  [...cloud.attempts, ...local.attempts].forEach((attempt) => {
    attemptsByKey.set(attemptKey(attempt), attempt);
  });

  const attempts = Array.from(attemptsByKey.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const savedQuestionIds = Array.from(new Set([...cloud.savedQuestionIds, ...local.savedQuestionIds]));

  return {
    attempts,
    savedQuestionIds,
    questionStats: {
      ...cloud.questionStats,
      ...local.questionStats
    }
  };
}

export async function hydrateQuestionProgressFromCloud() {
  const cloud = await getCloudUser();

  if (!cloud) {
    return readStorage();
  }

  const { data, error } = await cloud.supabase
    .from("user_progress_snapshots")
    .select("progress")
    .eq("user_id", cloud.user.id)
    .maybeSingle();

  if (error) {
    logCloudWarning("Load question progress", error);
    return readStorage();
  }

  const localProgress = readStorage();
  const cloudProgress = normalizeProgress(data?.progress);
  const merged = mergeProgress(localProgress, cloudProgress);

  writeStorage(merged, { syncCloud: false });
  await saveQuestionProgressToCloud(merged);
  return merged;
}

export async function saveQuestionProgressToCloud(progress: UserProgress) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return;
  }

  const now = new Date().toISOString();
  const weakAreas = calculateWeakAreas(progress);

  const { error: snapshotError } = await cloud.supabase
    .from("user_progress_snapshots")
    .upsert({
      user_id: cloud.user.id,
      progress,
      updated_at: now
    }, { onConflict: "user_id" });
  logCloudWarning("Save progress snapshot", snapshotError);

  if (progress.attempts.length) {
    const { error } = await cloud.supabase
      .from("question_attempts")
      .upsert(progress.attempts.map((attempt) => ({
        user_id: cloud.user.id,
        attempt_key: attemptKey(attempt),
        question_id: attempt.questionId,
        selected_choice: attempt.selectedChoice,
        correct_choice: attempt.correctChoice,
        is_correct: attempt.isCorrect,
        subject: attempt.subject,
        category: attempt.category,
        subtopic: attempt.subtopic,
        difficulty: attempt.difficulty,
        attempted_at: attempt.timestamp,
        time_spent: attempt.timeSpent,
        guessed: attempt.guessed,
        marked_confusing: attempt.markedConfusing
      })), { onConflict: "user_id,attempt_key" });
    logCloudWarning("Save attempts", error);
  }

  const statRows = Object.entries(progress.questionStats).map(([questionId, stats]) => ({
    user_id: cloud.user.id,
    question_id: questionId,
    attempts: stats.attempts,
    correct: stats.correct,
    incorrect: stats.incorrect,
    saved_for_review: stats.savedForReview,
    guessed: stats.guessed,
    confusing: stats.confusing,
    total_time: stats.totalTime,
    last_attempt_at: stats.lastAttemptAt || null,
    updated_at: now
  }));

  if (statRows.length) {
    const { error } = await cloud.supabase
      .from("question_stats")
      .upsert(statRows, { onConflict: "user_id,question_id" });
    logCloudWarning("Save question stats", error);
  }

  const { error: savedDeleteError } = await cloud.supabase
    .from("saved_questions")
    .delete()
    .eq("user_id", cloud.user.id);
  logCloudWarning("Refresh saved questions", savedDeleteError);

  if (progress.savedQuestionIds.length) {
    const { error } = await cloud.supabase
      .from("saved_questions")
      .upsert(progress.savedQuestionIds.map((questionId) => ({
        user_id: cloud.user.id,
        question_id: questionId,
        updated_at: now
      })), { onConflict: "user_id,question_id" });
    logCloudWarning("Save saved questions", error);
  }

  const { error: weakDeleteError } = await cloud.supabase
    .from("weakness_scores")
    .delete()
    .eq("user_id", cloud.user.id);
  logCloudWarning("Refresh weakness scores", weakDeleteError);

  if (weakAreas.length) {
    const { error } = await cloud.supabase
      .from("weakness_scores")
      .upsert(weakAreas.map((area) => ({
        user_id: cloud.user.id,
        area_id: area.id,
        subject: area.subject,
        category: area.category,
        subtopic: area.subtopic,
        score: area.score,
        missed: area.missed,
        guessed: area.guessed,
        confusing: area.confusing,
        slow: area.slow,
        correct_recovery: area.correctRecovery,
        reason: area.reason,
        question_ids: area.questionIds,
        updated_at: now
      })), { onConflict: "user_id,area_id" });
    logCloudWarning("Save weakness scores", error);
  }
}

export async function clearQuestionProgressFromCloud() {
  const cloud = await getCloudUser();

  if (!cloud) {
    return;
  }

  const tables = [
    "question_attempts",
    "question_stats",
    "saved_questions",
    "weakness_scores",
    "user_progress_snapshots"
  ];

  await Promise.all(tables.map(async (table) => {
    const { error } = await cloud.supabase.from(table).delete().eq("user_id", cloud.user.id);
    logCloudWarning(`Clear ${table}`, error);
  }));
}
