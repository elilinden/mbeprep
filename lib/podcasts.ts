import type { PodcastEpisode } from "@/lib/types";

const podcastFiles = [
  {
    id: "agency",
    fileName: "agency.mp3",
    title: "Agency",
    subject: "Agency",
    topic: "Authority, ratification, principal liability, and the core agency relationships",
    description: "Use this focused Agency pass before reviewing flashcards, outlines, or questions."
  },
  {
    id: "contracts",
    fileName: "contracts.mp3",
    title: "Contracts",
    subject: "Contracts",
    topic: "Formation, performance, breach, and remedies",
    description: "Listen through the recurring Contracts patterns, then jump into related practice."
  },
  {
    id: "corporations",
    fileName: "corporations.mp3",
    title: "Corporations & LLCs",
    subject: "Corporations",
    topic: "Formation, fiduciary duties, shareholder rights, veil piercing, and LLC rules",
    description: "Review Corporations and LLC rules in audio form before drilling flashcards or outlines."
  },
  {
    id: "civil-procedure",
    fileName: "civil-procedure.mp3",
    title: "Civil Procedure",
    subject: "Civil Procedure",
    topic: "Federal jurisdiction, pleadings, joinder, discovery, motions, trial, and preclusion",
    description: "Review Federal Civil Procedure rules in audio form before drilling flashcards or outlines."
  },
  {
    id: "criminal-law",
    fileName: "criminal-law.mp3",
    title: "Criminal Law",
    subject: "Criminal Law",
    topic: "A practical attack plan for criminal liability, offenses, parties, and defenses",
    description: "Use this guided Criminal Law pass before reviewing the outline, flashcards, or questions."
  },
  {
    id: "criminal-procedure",
    fileName: "criminal-procedure.mp3",
    title: "Criminal Procedure",
    subject: "Criminal Procedure",
    topic: "The constitutional protections that shape criminal investigations and prosecutions",
    description: "Review the core Criminal Procedure framework before moving into outlines, flashcards, or questions."
  },
  {
    id: "evidence",
    fileName: "evidence.mp3",
    title: "Evidence",
    subject: "Evidence",
    topic: "Purpose first, rule second, and the evidence strategy that connects them",
    description: "Work through a practical Evidence approach before moving into flashcards, outlines, or questions."
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
