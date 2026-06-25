-- CreateEnum
CREATE TYPE "MasteryDataConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MasteryEventType" AS ENUM ('QUESTION_ATTEMPT', 'REVIEW_ATTEMPT', 'ESSAY_RUBRIC_MISS', 'RULE_REVIEW_DUE');

-- CreateEnum
CREATE TYPE "ReviewItemStatus" AS ENUM ('OPEN', 'DUE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewItemSource" AS ENUM ('QUESTION_INCORRECT', 'LOW_CONFIDENCE_CORRECT', 'HIGH_CONFIDENCE_ERROR', 'ESSAY_RUBRIC_MISS', 'RULE_REVIEW_DUE');

-- CreateEnum
CREATE TYPE "ReviewAttemptOutcome" AS ENUM ('REVIEWED', 'CORRECT', 'INCORRECT', 'SNOOZED');

-- CreateTable
CREATE TABLE "TopicMasteryState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "knowledgeComponent" DOUBLE PRECISION NOT NULL,
    "retentionComponent" DOUBLE PRECISION NOT NULL,
    "coverageComponent" DOUBLE PRECISION NOT NULL,
    "speedComponent" DOUBLE PRECISION NOT NULL,
    "confidenceCalibrationComponent" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "dataConfidence" "MasteryDataConfidence" NOT NULL DEFAULT 'LOW',
    "uniqueExposureCount" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "explanation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicMasteryState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "eventType" "MasteryEventType" NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "questionAttemptId" TEXT,
    "questionVersionId" TEXT,
    "ruleId" TEXT,
    "isCorrect" BOOLEAN,
    "confidence" "AttemptConfidence",
    "responseTimeMs" INTEGER,
    "estimatedSeconds" INTEGER,
    "questionKey" TEXT,
    "ruleKey" TEXT,
    "eventWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasteryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "knowledgeComponent" DOUBLE PRECISION NOT NULL,
    "retentionComponent" DOUBLE PRECISION NOT NULL,
    "coverageComponent" DOUBLE PRECISION NOT NULL,
    "speedComponent" DOUBLE PRECISION NOT NULL,
    "confidenceCalibrationComponent" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "dataConfidence" "MasteryDataConfidence" NOT NULL,
    "uniqueExposureCount" INTEGER NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "explanation" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "questionVersionId" TEXT,
    "questionAttemptId" TEXT,
    "podcastEpisodeId" TEXT,
    "source" "ReviewItemSource" NOT NULL,
    "status" "ReviewItemStatus" NOT NULL DEFAULT 'OPEN',
    "topic" TEXT NOT NULL,
    "rule" TEXT,
    "criticalFact" TEXT NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "errorReason" TEXT NOT NULL,
    "relatedPodcast" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAttempt" (
    "id" TEXT NOT NULL,
    "reviewItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outcome" "ReviewAttemptOutcome" NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicMasteryState_userId_overallScore_idx" ON "TopicMasteryState"("userId", "overallScore");

-- CreateIndex
CREATE INDEX "TopicMasteryState_taxonomyNodeId_overallScore_idx" ON "TopicMasteryState"("taxonomyNodeId", "overallScore");

-- CreateIndex
CREATE INDEX "TopicMasteryState_nextReviewAt_idx" ON "TopicMasteryState"("nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMasteryState_userId_taxonomyNodeId_algorithmVersion_key" ON "TopicMasteryState"("userId", "taxonomyNodeId", "algorithmVersion");

-- CreateIndex
CREATE INDEX "MasteryEvent_userId_taxonomyNodeId_occurredAt_idx" ON "MasteryEvent"("userId", "taxonomyNodeId", "occurredAt");

-- CreateIndex
CREATE INDEX "MasteryEvent_algorithmVersion_occurredAt_idx" ON "MasteryEvent"("algorithmVersion", "occurredAt");

-- CreateIndex
CREATE INDEX "MasteryEvent_questionAttemptId_idx" ON "MasteryEvent"("questionAttemptId");

-- CreateIndex
CREATE INDEX "MasteryEvent_questionVersionId_idx" ON "MasteryEvent"("questionVersionId");

-- CreateIndex
CREATE INDEX "MasteryEvent_ruleId_idx" ON "MasteryEvent"("ruleId");

-- CreateIndex
CREATE INDEX "MasterySnapshot_userId_taxonomyNodeId_calculatedAt_idx" ON "MasterySnapshot"("userId", "taxonomyNodeId", "calculatedAt");

-- CreateIndex
CREATE INDEX "MasterySnapshot_algorithmVersion_calculatedAt_idx" ON "MasterySnapshot"("algorithmVersion", "calculatedAt");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_status_dueAt_idx" ON "ReviewItem"("userId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ReviewItem_taxonomyNodeId_status_idx" ON "ReviewItem"("taxonomyNodeId", "status");

-- CreateIndex
CREATE INDEX "ReviewItem_questionAttemptId_idx" ON "ReviewItem"("questionAttemptId");

-- CreateIndex
CREATE INDEX "ReviewItem_questionVersionId_idx" ON "ReviewItem"("questionVersionId");

-- CreateIndex
CREATE INDEX "ReviewItem_ruleId_idx" ON "ReviewItem"("ruleId");

-- CreateIndex
CREATE INDEX "ReviewAttempt_reviewItemId_createdAt_idx" ON "ReviewAttempt"("reviewItemId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewAttempt_userId_createdAt_idx" ON "ReviewAttempt"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TopicMasteryState" ADD CONSTRAINT "TopicMasteryState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMasteryState" ADD CONSTRAINT "TopicMasteryState_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_questionAttemptId_fkey" FOREIGN KEY ("questionAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterySnapshot" ADD CONSTRAINT "MasterySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterySnapshot" ADD CONSTRAINT "MasterySnapshot_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_questionAttemptId_fkey" FOREIGN KEY ("questionAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_reviewItemId_fkey" FOREIGN KEY ("reviewItemId") REFERENCES "ReviewItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
