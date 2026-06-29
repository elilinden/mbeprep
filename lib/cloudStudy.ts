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

export async function hydrateFlashcardProgressFromCloud(localProgress: Record<string, FlashcardProgress>) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return localProgress;
  }

  const { data, error } = await cloud.supabase
    .from("flashcard_progress")
    .select("card_id, attempts, got_it, needs_work, last_rating, last_reviewed_at")
    .eq("user_id", cloud.user.id);

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
      lastReviewedAt: row.last_reviewed_at
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
    updated_at: new Date().toISOString()
  }));

  if (!rows.length) {
    return;
  }

  const { error } = await cloud.supabase
    .from("flashcard_progress")
    .upsert(rows, { onConflict: "user_id,card_id" });
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
  localNotes: Record<string, PodcastNoteRecord>,
  localBookmarks: string[]
) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return { notes: localNotes, bookmarks: localBookmarks };
  }

  const [{ data: noteRows, error: notesError }, { data: bookmarkRows, error: bookmarksError }] = await Promise.all([
    cloud.supabase
      .from("podcast_notes")
      .select("episode_id, note, updated_at")
      .eq("user_id", cloud.user.id),
    cloud.supabase
      .from("podcast_bookmarks")
      .select("episode_id")
      .eq("user_id", cloud.user.id)
  ]);

  logCloudWarning("Load podcast notes", notesError);
  logCloudWarning("Load podcast bookmarks", bookmarksError);

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

  const bookmarks = Array.from(new Set([
    ...localBookmarks,
    ...(bookmarkRows || []).map((row) => row.episode_id)
  ]));

  await Promise.all([
    ...Object.values(notes).map((note) => savePodcastNoteToCloud(note)),
    ...bookmarks.map((episodeId) => savePodcastBookmarkToCloud(episodeId, true))
  ]);

  return { notes, bookmarks };
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

export async function savePodcastBookmarkToCloud(episodeId: string, bookmarked: boolean) {
  const cloud = await getCloudUser();

  if (!cloud) {
    return;
  }

  if (!bookmarked) {
    const { error } = await cloud.supabase
      .from("podcast_bookmarks")
      .delete()
      .eq("user_id", cloud.user.id)
      .eq("episode_id", episodeId);
    logCloudWarning("Delete podcast bookmark", error);
    return;
  }

  const { error } = await cloud.supabase
    .from("podcast_bookmarks")
    .upsert({
      user_id: cloud.user.id,
      episode_id: episodeId,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,episode_id" });
  logCloudWarning("Save podcast bookmark", error);
}
