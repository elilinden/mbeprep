import type { TranscriptSegment } from "./podcast-types";

export type TranscriptSearchResult = TranscriptSegment & {
  highlightedText: string;
};

export function searchTranscript(
  segments: readonly TranscriptSegment[],
  query: string,
) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const expression = new RegExp(escapeRegExp(normalizedQuery), "ig");

  return segments
    .filter((segment) =>
      segment.text.toLowerCase().includes(normalizedQuery.toLowerCase()),
    )
    .map(
      (segment): TranscriptSearchResult => ({
        ...segment,
        highlightedText: segment.text.replace(
          expression,
          (match) => `<mark>${match}</mark>`,
        ),
      }),
    );
}

export function getActiveTranscriptSegment(
  segments: readonly TranscriptSegment[],
  currentSeconds: number,
) {
  return (
    segments.find(
      (segment) =>
        segment.startSeconds <= currentSeconds &&
        segment.endSeconds > currentSeconds,
    ) ?? null
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
