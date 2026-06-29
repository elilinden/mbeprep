import { PodcastsClient } from "@/components/PodcastsClient";
import { getPodcastEpisodes } from "@/lib/podcasts";

export default function PodcastsPage() {
  return <PodcastsClient episodes={getPodcastEpisodes()} />;
}
