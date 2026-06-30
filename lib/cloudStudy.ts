"use client";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { FlashcardProgress } from "@/lib/types";

type PodcastNoteRecord = {
  episodeId: string;
  note: string;
  updatedAt: string;
};

type CloudError = {
  code?: string;
  message?: string;
};

type FlashcardProgressRow = {
  card_id: string;
  attempts: number | null;
  got_it: number | null;
  needs_work: number | null;
  last_rating: FlashcardProgress["lastRating"];
  last_reviewed_at: string;
  ease_factor?: number | null;
  interval_days?: number | null;
  repetitions?: number | null;
  lapses?: number | null;
  next_review_at?: string | null;
};

function logCloudWarning(area: string, error: CloudError | null) {
  if (!error) {
    return;
  }

  if (error.code === "42P01" || error.message?.toLowerCase().includes("schema cache")) {
    console.warn(`${area}: Supabase study tables are not set up yet.`);
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

function newerFlashcardProgress(local?: FlashcardProgress, cloud?: FlashcardProgress) {
  if (!cloud) return local;
  if (!local) return cloud;
  return new Date(cloud.lastReviewedAt).getTime() > new Date(local.lastReviewedAt).getTime() ? cloud : local;
}

function isMissingColumnError(error: CloudError | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  return error.code === "42703" || message.includes("column") || message.includes("schema cache");
}

export async function hydrateFlashcardProgressFromCloud(localProgress: Record<string, FlashcardProgress>) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return localProgress;
  }

  const advancedResult = await cloud.supabase
    .from("flashcard_progress")
    .select("card_id, attempts, got_it, needs_work, last_rating, last_reviewed_at, ease_factor, interval_days, repetitions, lapses, next_review_at")
    .eq("user_id", cloud.user.id);
  let data = advancedResult.data as FlashcardProgressRow[] | null;
  let error = advancedResult.error;

  if (isMissingColumnError(error)) {
    const fallback = await cloud.supabase
      .from("flashcard_progress")
      .select("card_id, attempts, got_it, needs_work, last_rating, last_reviewed_at")
      .eq("user_id", cloud.user.id);
    data = fallback.data as FlashcardProgressRow[] | null;
    error = fallback.error;
  }

  if (error) {
    logCloudWarning("Load flashcards", error);
    return localProgress;
  }

  const merged = { ...localProgress };

  (data || []).forEach((row) => {
    const cloudProgress: FlashcardProgress = {
      cardId: row.card_id,
      attempts: row.attempts || 0,
      gotIt: row.got_it || 0,
      needsWork: row.needs_work || 0,
      lastRating: row.last_rating,
      lastReviewedAt: row.last_reviewed_at,
      easeFactor: row.ease_factor ?? undefined,
      intervalDays: row.interval_days ?? undefined,
      repetitions: row.repetitions ?? undefined,
      lapses: row.lapses ?? undefined,
      nextReviewAt: row.next_review_at ?? undefined
    };
    merged[row.card_id] = newerFlashcardProgress(merged[row.card_id], cloudProgress) || cloudProgress;
  });

  await saveFlashcardProgressToCloud(merged);
  return merged;
}

export async function saveFlashcardProgressToCloud(progress: Record<string, FlashcardProgress>) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return;
  }

  const rows = Object.values(progress).map((item) => ({
    user_id: cloud.user.id,
    card_id: item.cardId,
    attempts: item.attempts,
    got_it: item.gotIt,
    needs_work: item.needsWork,
    last_rating: item.lastRating,
    last_reviewed_at: item.lastReviewedAt,
    ease_factor: item.easeFactor,
    interval_days: item.intervalDays,
    repetitions: item.repetitions,
    lapses: item.lapses,
    next_review_at: item.nextReviewAt,
    updated_at: new Date().toISOString()
  }));

  if (!rows.length) {
    return;
  }

  const { error } = await cloud.supabase
    .from("flashcard_progress")
    .upsert(rows, { onConflict: "user_id,card_id" });

  if (isMissingColumnError(error)) {
    const fallbackRows = Object.values(progress).map((item) => ({
      user_id: cloud.user.id,
      card_id: item.cardId,
      attempts: item.attempts,
      got_it: item.gotIt,
      needs_work: item.needsWork,
      last_rating: item.lastRating,
      last_reviewed_at: item.lastReviewedAt,
      updated_at: new Date().toISOString()
    }));
    const { error: fallbackError } = await cloud.supabase
      .from("flashcard_progress")
      .upsert(fallbackRows, { onConflict: "user_id,card_id" });
    logCloudWarning("Save flashcards", fallbackError);
    return;
  }

  logCloudWarning("Save flashcards", error);
}

export async function deleteFlashcardProgressFromCloud(cardIds: string[]) {
  const cloud = await getCloudUser();

  if (!cloud || !cardIds.length) {
    return;
  }

  const { error } = await cloud.supabase
    .from("flashcard_progress")
    .delete()
    .eq("user_id", cloud.user.id)
    .in("card_id", cardIds);
  logCloudWarning("Delete flashcards", error);
}

export async function hydratePodcastStateFromCloud(
  localNotes: Record<string, PodcastNoteRecord>
) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return localNotes;
  }

  const { data: noteRows, error: notesError } = await cloud.supabase
    .from("podcast_notes")
    .select("episode_id, note, updated_at")
    .eq("user_id", cloud.user.id);

  logCloudWarning("Load podcast notes", notesError);

  const notes = { ...localNotes };
  (noteRows || []).forEach((row) => {
    const local = notes[row.episode_id];
    if (!local || new Date(row.updated_at).getTime() > new Date(local.updatedAt).getTime()) {
      notes[row.episode_id] = {
        episodeId: row.episode_id,
        note: row.note || "",
        updatedAt: row.updated_at
      };
    }
  });

  await Promise.all(Object.values(notes).map((note) => savePodcastNoteToCloud(note)));

  return notes;
}

export async function savePodcastNoteToCloud(note: PodcastNoteRecord) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return;
  }

  const { error } = await cloud.supabase
    .from("podcast_notes")
    .upsert({
      user_id: cloud.user.id,
      episode_id: note.episodeId,
      note: note.note,
      updated_at: note.updatedAt
    }, { onConflict: "user_id,episode_id" });
  logCloudWarning("Save podcast note", error);
}
