-- CreateEnum
CREATE TYPE "ContentWorkflowStatus" AS ENUM ('DRAFT', 'LEGAL_REVIEW', 'EDITORIAL_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "DistractorType" AS ENUM ('NONE', 'MISSTATEMENT', 'SCOPE_ERROR', 'FACT_CONFUSION', 'OVERGENERALIZATION', 'IRRELEVANT');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('QUESTION', 'ESSAY', 'PODCAST');

-- CreateEnum
CREATE TYPE "ReviewStep" AS ENUM ('LEGAL', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ImportFormat" AS ENUM ('CSV', 'JSON');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PREVIEW', 'READY', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserContentReportStatus" AS ENUM ('OPEN', 'TRIAGED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "examTrackId" TEXT NOT NULL,
    "format" "QuestionFormat" NOT NULL,
    "stem" TEXT NOT NULL,
    "callOfQuestion" TEXT NOT NULL,
    "primaryTopicId" TEXT NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "estimatedSeconds" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "authorId" TEXT,
    "reviewerId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionChoice" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "rationale" TEXT NOT NULL,
    "distractorType" "DistractorType" NOT NULL DEFAULT 'NONE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTopic" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayVersion" (
    "id" TEXT NOT NULL,
    "essayId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "examTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "primaryTopicId" TEXT,
    "sourceId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "authorId" TEXT,
    "reviewerId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayRubricItem" (
    "id" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxPoints" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayRubricItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastSeries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transcriptUri" TEXT,
    "transcriptText" TEXT,
    "audioUri" TEXT,
    "sourceId" TEXT,
    "licenseId" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "status" "ContentWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReview" (
    "id" TEXT NOT NULL,
    "contentKind" "ContentKind" NOT NULL,
    "step" "ReviewStep" NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "notes" TEXT,
    "fromStatus" "ContentWorkflowStatus" NOT NULL,
    "toStatus" "ContentWorkflowStatus" NOT NULL,
    "questionVersionId" TEXT,
    "essayVersionId" TEXT,
    "podcastEpisodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "format" "ImportFormat" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PREVIEW',
    "filename" TEXT NOT NULL,
    "submittedById" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedRows" INTEGER NOT NULL DEFAULT 0,
    "rejectedRows" INTEGER NOT NULL DEFAULT 0,
    "previewJson" JSONB,
    "errorReportJson" JSONB,
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "contentKind" "ContentKind" NOT NULL,
    "questionId" TEXT,
    "essayId" TEXT,
    "podcastEpisodeId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "UserContentReportStatus" NOT NULL DEFAULT 'OPEN',
    "moderationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_key_key" ON "Question"("key");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "QuestionVersion_status_effectiveFrom_effectiveTo_idx" ON "QuestionVersion"("status", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "QuestionVersion_examTrackId_status_idx" ON "QuestionVersion"("examTrackId", "status");

-- CreateIndex
CREATE INDEX "QuestionVersion_primaryTopicId_status_idx" ON "QuestionVersion"("primaryTopicId", "status");

-- CreateIndex
CREATE INDEX "QuestionVersion_licenseId_status_idx" ON "QuestionVersion"("licenseId", "status");

-- CreateIndex
CREATE INDEX "QuestionVersion_sourceId_idx" ON "QuestionVersion"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");

-- CreateIndex
CREATE INDEX "QuestionChoice_questionVersionId_isCorrect_idx" ON "QuestionChoice"("questionVersionId", "isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionChoice_questionVersionId_label_key" ON "QuestionChoice"("questionVersionId", "label");

-- CreateIndex
CREATE INDEX "QuestionTopic_taxonomyNodeId_idx" ON "QuestionTopic"("taxonomyNodeId");

-- CreateIndex
CREATE INDEX "QuestionTopic_questionVersionId_isPrimary_idx" ON "QuestionTopic"("questionVersionId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTopic_questionVersionId_taxonomyNodeId_key" ON "QuestionTopic"("questionVersionId", "taxonomyNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Essay_key_key" ON "Essay"("key");

-- CreateIndex
CREATE INDEX "Essay_status_idx" ON "Essay"("status");

-- CreateIndex
CREATE INDEX "EssayVersion_status_effectiveFrom_effectiveTo_idx" ON "EssayVersion"("status", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "EssayVersion_examTrackId_status_idx" ON "EssayVersion"("examTrackId", "status");

-- CreateIndex
CREATE INDEX "EssayVersion_primaryTopicId_status_idx" ON "EssayVersion"("primaryTopicId", "status");

-- CreateIndex
CREATE INDEX "EssayVersion_licenseId_status_idx" ON "EssayVersion"("licenseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EssayVersion_essayId_version_key" ON "EssayVersion"("essayId", "version");

-- CreateIndex
CREATE INDEX "EssayRubricItem_essayVersionId_sortOrder_idx" ON "EssayRubricItem"("essayVersionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EssayRubricItem_essayVersionId_label_key" ON "EssayRubricItem"("essayVersionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastSeries_key_key" ON "PodcastSeries"("key");

-- CreateIndex
CREATE INDEX "PodcastSeries_status_idx" ON "PodcastSeries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_key_key" ON "PodcastEpisode"("key");

-- CreateIndex
CREATE INDEX "PodcastEpisode_seriesId_status_idx" ON "PodcastEpisode"("seriesId", "status");

-- CreateIndex
CREATE INDEX "PodcastEpisode_status_effectiveFrom_effectiveTo_idx" ON "PodcastEpisode"("status", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "PodcastEpisode_licenseId_status_idx" ON "PodcastEpisode"("licenseId", "status");

-- CreateIndex
CREATE INDEX "ContentReview_contentKind_step_decision_idx" ON "ContentReview"("contentKind", "step", "decision");

-- CreateIndex
CREATE INDEX "ContentReview_reviewerId_createdAt_idx" ON "ContentReview"("reviewerId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReview_questionVersionId_idx" ON "ContentReview"("questionVersionId");

-- CreateIndex
CREATE INDEX "ContentReview_essayVersionId_idx" ON "ContentReview"("essayVersionId");

-- CreateIndex
CREATE INDEX "ContentReview_podcastEpisodeId_idx" ON "ContentReview"("podcastEpisodeId");

-- CreateIndex
CREATE INDEX "ImportJob_status_createdAt_idx" ON "ImportJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_submittedById_idx" ON "ImportJob"("submittedById");

-- CreateIndex
CREATE INDEX "UserContentReport_status_createdAt_idx" ON "UserContentReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserContentReport_contentKind_status_idx" ON "UserContentReport"("contentKind", "status");

-- CreateIndex
CREATE INDEX "UserContentReport_reporterId_idx" ON "UserContentReport"("reporterId");

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_examTrackId_fkey" FOREIGN KEY ("examTrackId") REFERENCES "ExamTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_primaryTopicId_fkey" FOREIGN KEY ("primaryTopicId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "ContentLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionChoice" ADD CONSTRAINT "QuestionChoice_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_examTrackId_fkey" FOREIGN KEY ("examTrackId") REFERENCES "ExamTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_primaryTopicId_fkey" FOREIGN KEY ("primaryTopicId") REFERENCES "TaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "ContentLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayRubricItem" ADD CONSTRAINT "EssayRubricItem_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "PodcastSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "ContentLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentReport" ADD CONSTRAINT "UserContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentReport" ADD CONSTRAINT "UserContentReport_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentReport" ADD CONSTRAINT "UserContentReport_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentReport" ADD CONSTRAINT "UserContentReport_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
