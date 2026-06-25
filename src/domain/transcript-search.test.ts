import { describe, expect, it } from "vitest";

import {
  getActiveTranscriptSegment,
  searchTranscript,
} from "./transcript-search";

const segments = [
  {
    id: "one",
    startSeconds: 0,
    endSeconds: 20,
    text: "DEMO_NOT_FOR_PUBLICATION opening segment",
  },
  {
    id: "two",
    startSeconds: 20,
    endSeconds: 40,
    text: "DEMO_NOT_FOR_PUBLICATION transcript search target",
  },
];

describe("transcript search", () => {
  it("finds transcript matches with highlighting", () => {
    const results = searchTranscript(segments, "search");

    expect(results).toHaveLength(1);
    expect(results[0]?.highlightedText).toContain("<mark>search</mark>");
  });

  it("resolves the active synchronized transcript segment", () => {
    expect(getActiveTranscriptSegment(segments, 25)?.id).toBe("two");
  });
});
