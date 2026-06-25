"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/auth/app-auth";
import { requireCompletedOnboarding } from "@/server/onboarding-access";
import {
  addPodcastBookmark,
  addPodcastNote,
  savePodcastProgress,
} from "@/server/podcast-memory-store";

export async function savePodcastProgressAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const episodeId = String(formData.get("episodeId") ?? "");
  const positionSeconds = Number(formData.get("positionSeconds") ?? "0");
  const previousPositionSeconds = Number(
    formData.get("previousPositionSeconds") ?? "0",
  );

  savePodcastProgress({
    userId: user.id,
    episodeId,
    positionSeconds,
    previousPositionSeconds,
  });
  revalidatePath(`/audio/${episodeId}`);
  revalidatePath("/audio");
}

export async function createPodcastBookmarkAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const episodeId = String(formData.get("episodeId") ?? "");
  addPodcastBookmark({
    userId: user.id,
    episodeId,
    timestampSeconds: Number(formData.get("timestampSeconds") ?? "0"),
    label: String(formData.get("label") ?? ""),
  });
  revalidatePath(`/audio/${episodeId}`);
}

export async function createPodcastNoteAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const episodeId = String(formData.get("episodeId") ?? "");
  addPodcastNote({
    userId: user.id,
    episodeId,
    timestampSeconds: Number(formData.get("timestampSeconds") ?? "0"),
    body: String(formData.get("body") ?? ""),
  });
  revalidatePath(`/audio/${episodeId}`);
}
