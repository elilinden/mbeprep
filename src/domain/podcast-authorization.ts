import { hasRole, type AppRole } from "@/auth/roles";

import type { AudioProcessingState } from "./podcast-types";

export type PodcastActor = {
  id: string;
  roles: readonly AppRole[];
};

export function canUploadPodcastAudio(actor: PodcastActor) {
  return hasRole(actor.roles, "ADMIN") || hasRole(actor.roles, "EDITOR");
}

export function assertCanUploadPodcastAudio(actor: PodcastActor) {
  if (!canUploadPodcastAudio(actor)) {
    throw new Error(
      "Only editors and administrators may upload podcast audio.",
    );
  }
}

export function canReviewPodcastAudio(actor: PodcastActor) {
  return hasRole(actor.roles, "ADMIN") || hasRole(actor.roles, "REVIEWER");
}

export function canPublishPodcastEpisode(input: {
  actor: PodcastActor;
  processingState: AudioProcessingState;
  reviewed: boolean;
}) {
  return (
    hasRole(input.actor.roles, "ADMIN") &&
    input.processingState === "READY_FOR_REVIEW" &&
    input.reviewed
  );
}

export function assertCanPublishPodcastEpisode(input: {
  actor: PodcastActor;
  processingState: AudioProcessingState;
  reviewed: boolean;
}) {
  if (!canPublishPodcastEpisode(input)) {
    throw new Error("Podcast episodes must be reviewed before publication.");
  }
}
