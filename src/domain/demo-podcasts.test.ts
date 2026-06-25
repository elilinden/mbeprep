import { describe, expect, it } from "vitest";

import { demoPodcastLibrary } from "./demo-podcasts";

describe("demoPodcastLibrary", () => {
  it("includes the user-provided subject podcasts with stable private object keys", () => {
    expect(
      demoPodcastLibrary.map((episode) => ({
        id: episode.id,
        title: episode.title,
        status: episode.status,
        dataClassification: episode.dataClassification,
        audioObjectKey: episode.audioObjectKey,
        transcriptText: episode.transcriptText,
        transcriptSegments: episode.transcriptSegments,
      })),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "user-podcast-torts",
          title: "Torts",
          status: "PUBLISHED",
          dataClassification: "DEMO_NOT_FOR_PUBLICATION",
          audioObjectKey: "user-supplied/torts.mp3",
          transcriptText: null,
          transcriptSegments: [],
        }),
        expect.objectContaining({
          id: "user-podcast-real-property",
          title: "Real Property",
          status: "PUBLISHED",
          dataClassification: "DEMO_NOT_FOR_PUBLICATION",
          audioObjectKey: "user-supplied/real-property.mp3",
          transcriptText: null,
          transcriptSegments: [],
        }),
        expect.objectContaining({
          id: "user-podcast-contracts",
          title: "Contracts",
          status: "PUBLISHED",
          dataClassification: "DEMO_NOT_FOR_PUBLICATION",
          audioObjectKey: "user-supplied/contracts.mp3",
          transcriptText: null,
          transcriptSegments: [],
        }),
      ]),
    );
  });
});
