import type { PodcastEpisode } from "@/lib/types";

const podcastFiles = [
  {
    id: "contracts",
    fileName: "contracts.mp3",
    title: "Contracts",
    subject: "Contracts",
    topic: "Formation, performance, breach, and remedies",
    description: "Listen through the recurring Contracts patterns, then jump into related practice."
  },
  {
    id: "real-property",
    fileName: "real-property.mp3",
    title: "Real Property",
    subject: "Real Property",
    topic: "Estates, conveyancing, mortgages, and land-use rules",
    description: "Review the highest-yield Real Property rule clusters in audio form."
  },
  {
    id: "partnerships",
    fileName: "partnerships.mp3",
    title: "Partnerships",
    subject: "Partnerships",
    topic: "Accidental partnerships and personal liability rules",
    description: "Review when partnership status can arise by conduct and how personal liability follows."
  },
  {
    id: "torts",
    fileName: "torts.mp3",
    title: "Torts",
    subject: "Torts",
    topic: "Intentional torts, negligence, strict liability, and damages",
    description: "Use this as a calm pass through Torts issues before practice."
  }
];

export function getPodcastEpisodes(): PodcastEpisode[] {
  return podcastFiles.map((episode) => ({
    ...episode,
    src: `/podcasts/${episode.fileName}`
  }));
}
