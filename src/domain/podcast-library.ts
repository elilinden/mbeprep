import type {
  DemoPodcastEpisode,
  DemoQuestionVersion,
  DemoEssayVersion,
} from "./admin-content-types";

export type PodcastLibraryEpisode = DemoPodcastEpisode & {
  key: string;
  description: string;
  audioUri: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  lastReviewedAt: string | null;
  sourceKey: string;
  subject: string;
  topics: string[];
  summary: string;
  instructor: string;
  learningObjectives: string[];
  transcriptSegments: Array<{
    id: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
  }>;
  chapters: Array<{ id: string; title: string; startSeconds: number }>;
  relatedQuestions: DemoQuestionVersion[];
  relatedEssays: DemoEssayVersion[];
  durationSeconds: number;
  audioObjectKey: string;
};

export function searchPodcastLibrary(
  episodes: readonly PodcastLibraryEpisode[],
  filters: {
    query?: string;
    subject?: string;
    topic?: string;
  },
) {
  const query = filters.query?.trim().toLowerCase();

  return episodes.filter((episode) => {
    const matchesQuery =
      !query ||
      episode.title.toLowerCase().includes(query) ||
      episode.transcriptSegments.some((segment) =>
        segment.text.toLowerCase().includes(query),
      );
    const matchesSubject =
      !filters.subject || episode.subject === filters.subject;
    const matchesTopic =
      !filters.topic || episode.topics.includes(filters.topic);

    return matchesQuery && matchesSubject && matchesTopic;
  });
}
