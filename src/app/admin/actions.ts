"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/auth/app-auth";
import type { ContentWorkflowStatus } from "@/domain/admin-content-types";
import { assertCanTransitionContent } from "@/domain/content-workflow";
import {
  assertCanPublishPodcastEpisode,
  assertCanUploadPodcastAudio,
} from "@/domain/podcast-authorization";
import { InMemoryPodcastProcessingQueue } from "@/domain/podcast-processing";
import {
  addUploadedPodcastEpisode,
  findPodcastEpisode,
  markPodcastReviewed,
  publishPodcastEpisode,
} from "@/server/podcast-memory-store";
import { createPodcastStorageAdapter } from "@/server/storage/storage-adapter";

export async function publishDemoContentAction(formData: FormData) {
  const user = await requireAdmin();
  const currentStatus = String(
    formData.get("currentStatus"),
  ) as ContentWorkflowStatus;

  assertCanTransitionContent({
    actor: { id: user.id, roles: user.roles },
    currentStatus,
    nextStatus: "PUBLISHED",
    twoPersonReview: true,
  });
}

export async function retireDemoContentAction(formData: FormData) {
  const user = await requireAdmin();
  const currentStatus = String(
    formData.get("currentStatus"),
  ) as ContentWorkflowStatus;

  assertCanTransitionContent({
    actor: { id: user.id, roles: user.roles },
    currentStatus,
    nextStatus: "RETIRED",
    twoPersonReview: true,
  });
}

export async function uploadPodcastAudioAction(formData: FormData) {
  const user = await requireAdmin();
  assertCanUploadPodcastAudio({ id: user.id, roles: user.roles });

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("An MP3 or M4A file is required.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const objectKey = `uploads/${Date.now()}-${safeFilename(file.name)}`;
  const storage = createPodcastStorageAdapter();
  await storage.putObject?.({
    objectKey,
    file: {
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      bytes,
    },
  });

  const episode = addUploadedPodcastEpisode({
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    instructor: String(formData.get("instructor") ?? ""),
    learningObjectives: String(formData.get("learningObjectives") ?? "")
      .split("\n")
      .filter((objective) => objective.trim().length > 0),
    subject: String(formData.get("subject") ?? "Civil Procedure"),
    topics: String(formData.get("topics") ?? "")
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean),
    transcriptText: String(formData.get("transcriptText") ?? ""),
    transcriptSegmentsInput: String(formData.get("transcriptSegments") ?? ""),
    chaptersInput: String(formData.get("chapters") ?? ""),
    objectKey,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  const queue = new InMemoryPodcastProcessingQueue();
  await queue.enqueue({
    episodeId: episode.id,
    objectKey,
    requestedAt: new Date(),
  });

  revalidatePath("/admin");
}

export async function reviewPodcastEpisodeAction(formData: FormData) {
  await requireAdmin();
  markPodcastReviewed(String(formData.get("episodeId") ?? ""));
  revalidatePath("/admin");
}

export async function publishPodcastEpisodeAction(formData: FormData) {
  const user = await requireAdmin();
  const episodeId = String(formData.get("episodeId") ?? "");
  const episode = findPodcastEpisode(episodeId);

  if (!episode) {
    throw new Error("Podcast episode not found.");
  }

  assertCanPublishPodcastEpisode({
    actor: { id: user.id, roles: user.roles },
    processingState: episode.processingState,
    reviewed: episode.reviewed,
  });
  publishPodcastEpisode(episodeId);
  revalidatePath("/admin");
  revalidatePath("/audio");
}

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}
