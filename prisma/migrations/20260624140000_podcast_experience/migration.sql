-- CreateEnum
CREATE TYPE "AudioProcessingState" AS ENUM ('UPLOADED', 'PROCESSING', 'READY_FOR_REVIEW', 'PUBLISHED', 'FAILED', 'RETIRED');

-- CreateEnum
CREATE TYPE "PodcastLinkKind" AS ENUM ('QUESTION', 'ESSAY', 'RULE');

-- AlterTable
ALTER TABLE "PodcastEpisode" ADD COLUMN     "audioDurationSeconds" INTEGER,
ADD COLUMN     "audioMimeType" TEXT,
ADD COLUMN     "audioObjectKey" TEXT,
ADD COLUMN     "audioSizeBytes" INTEGER,
ADD COLUMN     "instructor" TEXT,
ADD COLUMN     "learningObjectives" TEXT[],
ADD COLUMN     "processingError" TEXT,
ADD COLUMN     "processingState" "AudioProcessingState" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "PodcastTranscriptSegment" (
    "id" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "endSeconds" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastTranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastChapter" (
    "id" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "endSeconds" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisodeTopic" (
    "id" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisodeTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastContentLink" (
    "id" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "linkKind" "PodcastLinkKind" NOT NULL,
    "questionId" TEXT,
    "essayId" TEXT,
    "ruleId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastContentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "positionSeconds" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PodcastProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastListenedSegment" (
    "id" TEXT NOT NULL,
    "podcastProgressId" TEXT NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "endSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastListenedSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podcastEpisodeId" TEXT NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PodcastTranscriptSegment_podcastEpisodeId_startSeconds_idx" ON "PodcastTranscriptSegment"("podcastEpisodeId", "startSeconds");

-- CreateIndex
CREATE INDEX "PodcastChapter_podcastEpisodeId_sortOrder_idx" ON "PodcastChapter"("podcastEpisodeId", "sortOrder");

-- CreateIndex
CREATE INDEX "PodcastChapter_podcastEpisodeId_startSeconds_idx" ON "PodcastChapter"("podcastEpisodeId", "startSeconds");

-- CreateIndex
CREATE INDEX "PodcastEpisodeTopic_taxonomyNodeId_idx" ON "PodcastEpisodeTopic"("taxonomyNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisodeTopic_podcastEpisodeId_taxonomyNodeId_key" ON "PodcastEpisodeTopic"("podcastEpisodeId", "taxonomyNodeId");

-- CreateIndex
CREATE INDEX "PodcastContentLink_podcastEpisodeId_sortOrder_idx" ON "PodcastContentLink"("podcastEpisodeId", "sortOrder");

-- CreateIndex
CREATE INDEX "PodcastContentLink_linkKind_idx" ON "PodcastContentLink"("linkKind");

-- CreateIndex
CREATE INDEX "PodcastProgress_podcastEpisodeId_updatedAt_idx" ON "PodcastProgress"("podcastEpisodeId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastProgress_userId_podcastEpisodeId_key" ON "PodcastProgress"("userId", "podcastEpisodeId");

-- CreateIndex
CREATE INDEX "PodcastListenedSegment_podcastProgressId_startSeconds_idx" ON "PodcastListenedSegment"("podcastProgressId", "startSeconds");

-- CreateIndex
CREATE INDEX "PodcastBookmark_userId_podcastEpisodeId_timestampSeconds_idx" ON "PodcastBookmark"("userId", "podcastEpisodeId", "timestampSeconds");

-- CreateIndex
CREATE INDEX "PodcastNote_userId_podcastEpisodeId_timestampSeconds_idx" ON "PodcastNote"("userId", "podcastEpisodeId", "timestampSeconds");

-- CreateIndex
CREATE INDEX "PodcastEpisode_processingState_status_idx" ON "PodcastEpisode"("processingState", "status");

-- AddForeignKey
ALTER TABLE "PodcastTranscriptSegment" ADD CONSTRAINT "PodcastTranscriptSegment_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastChapter" ADD CONSTRAINT "PodcastChapter_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisodeTopic" ADD CONSTRAINT "PodcastEpisodeTopic_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisodeTopic" ADD CONSTRAINT "PodcastEpisodeTopic_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastContentLink" ADD CONSTRAINT "PodcastContentLink_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastContentLink" ADD CONSTRAINT "PodcastContentLink_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastContentLink" ADD CONSTRAINT "PodcastContentLink_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastContentLink" ADD CONSTRAINT "PodcastContentLink_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastProgress" ADD CONSTRAINT "PodcastProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastProgress" ADD CONSTRAINT "PodcastProgress_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastListenedSegment" ADD CONSTRAINT "PodcastListenedSegment_podcastProgressId_fkey" FOREIGN KEY ("podcastProgressId") REFERENCES "PodcastProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastBookmark" ADD CONSTRAINT "PodcastBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastBookmark" ADD CONSTRAINT "PodcastBookmark_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastNote" ADD CONSTRAINT "PodcastNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastNote" ADD CONSTRAINT "PodcastNote_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
