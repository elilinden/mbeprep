import { describe, expect, it } from "vitest";

import {
  canPublishPodcastEpisode,
  canReviewPodcastAudio,
  canUploadPodcastAudio,
} from "./podcast-authorization";

describe("podcast authorization", () => {
  it("allows only editors and administrators to upload audio", () => {
    expect(canUploadPodcastAudio({ id: "student", roles: ["STUDENT"] })).toBe(
      false,
    );
    expect(canUploadPodcastAudio({ id: "editor", roles: ["EDITOR"] })).toBe(
      true,
    );
    expect(canUploadPodcastAudio({ id: "admin", roles: ["ADMIN"] })).toBe(true);
  });

  it("allows reviewers and administrators to review audio", () => {
    expect(canReviewPodcastAudio({ id: "editor", roles: ["EDITOR"] })).toBe(
      false,
    );
    expect(canReviewPodcastAudio({ id: "reviewer", roles: ["REVIEWER"] })).toBe(
      true,
    );
    expect(canReviewPodcastAudio({ id: "admin", roles: ["ADMIN"] })).toBe(true);
  });

  it("requires admin role, review, and ready state before publishing", () => {
    expect(
      canPublishPodcastEpisode({
        actor: { id: "admin", roles: ["ADMIN"] },
        processingState: "READY_FOR_REVIEW",
        reviewed: true,
      }),
    ).toBe(true);
    expect(
      canPublishPodcastEpisode({
        actor: { id: "admin", roles: ["ADMIN"] },
        processingState: "READY_FOR_REVIEW",
        reviewed: false,
      }),
    ).toBe(false);
    expect(
      canPublishPodcastEpisode({
        actor: { id: "reviewer", roles: ["REVIEWER"] },
        processingState: "READY_FOR_REVIEW",
        reviewed: true,
      }),
    ).toBe(false);
  });
});
