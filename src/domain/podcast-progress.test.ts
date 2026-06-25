import { describe, expect, it } from "vitest";

import {
  createBookmark,
  createPodcastNote,
  getResumePosition,
  getUniqueListenedSeconds,
  mergeListenedSegments,
  shouldPersistProgress,
  updatePodcastProgress,
} from "./podcast-progress";

describe("podcast progress", () => {
  it("merges overlapping listened segments and counts unique seconds", () => {
    const segments = mergeListenedSegments(
      [
        { startSeconds: 0, endSeconds: 20 },
        { startSeconds: 45, endSeconds: 60 },
      ],
      { startSeconds: 15, endSeconds: 50 },
    );

    expect(segments).toEqual([{ startSeconds: 0, endSeconds: 60 }]);
    expect(getUniqueListenedSeconds(segments)).toBe(60);
  });

  it("persists resume position and marks completion from unique listening", () => {
    const progress = updatePodcastProgress(
      { positionSeconds: 0, segments: [], completed: false },
      {
        positionSeconds: 92,
        listenedSegment: { startSeconds: 0, endSeconds: 92 },
        durationSeconds: 100,
      },
    );

    expect(getResumePosition(progress)).toBe(92);
    expect(progress.completed).toBe(true);
  });

  it("does not require per-frame persistence", () => {
    expect(shouldPersistProgress(0, 14_000)).toBe(false);
    expect(shouldPersistProgress(0, 15_000)).toBe(true);
  });

  it("creates timestamp bookmarks and requires note bodies", () => {
    expect(
      createBookmark({
        userId: "dev-learner",
        episodeId: "episode",
        timestampSeconds: 30,
        label: "DEMO_NOT_FOR_PUBLICATION",
      }),
    ).toMatchObject({ timestampSeconds: 30 });
    expect(() =>
      createPodcastNote({
        userId: "dev-learner",
        episodeId: "episode",
        timestampSeconds: 30,
        body: " ",
      }),
    ).toThrow("Podcast note body is required.");
  });
});
