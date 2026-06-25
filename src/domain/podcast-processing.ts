export type PodcastProcessingJob = {
  episodeId: string;
  objectKey: string;
  requestedAt: Date;
};

export interface PodcastProcessingQueue {
  enqueue(job: PodcastProcessingJob): Promise<void>;
}

export class InMemoryPodcastProcessingQueue implements PodcastProcessingQueue {
  readonly jobs: PodcastProcessingJob[] = [];

  async enqueue(job: PodcastProcessingJob) {
    this.jobs.push(job);
  }
}
