-- CreateEnum
CREATE TYPE "EssayAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "EssayResponseMode" AS ENUM ('FULL_ANSWER', 'OUTLINE_ONLY');

-- CreateEnum
CREATE TYPE "EssayFeedbackProviderStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'DISABLED');

-- AlterTable
ALTER TABLE "MasteryEvent" ADD COLUMN     "essayAttemptId" TEXT,
ADD COLUMN     "essayRubricItemId" TEXT;

-- AlterTable
ALTER TABLE "ReviewItem" ADD COLUMN     "essayAttemptId" TEXT,
ADD COLUMN     "essayRubricItemId" TEXT;

-- CreateTable
CREATE TABLE "EssayAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "status" "EssayAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "responseMode" "EssayResponseMode" NOT NULL DEFAULT 'FULL_ANSWER',
    "timerMinutes" INTEGER NOT NULL,
    "extendedTimeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "outline" TEXT NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayAutosave" (
    "id" TEXT NOT NULL,
    "essayAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "outline" TEXT NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "clientSavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayAutosave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssaySelfAssessment" (
    "id" TEXT NOT NULL,
    "essayAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "rubricVersion" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "earnedPoints" INTEGER NOT NULL,
    "reliabilityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssaySelfAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssaySelfAssessmentItem" (
    "id" TEXT NOT NULL,
    "essaySelfAssessmentId" TEXT NOT NULL,
    "essayRubricItemId" TEXT NOT NULL,
    "missed" BOOLEAN NOT NULL DEFAULT false,
    "awardedPoints" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssaySelfAssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayNote" (
    "id" TEXT NOT NULL,
    "essayAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssayFeedbackJob" (
    "id" TEXT NOT NULL,
    "essayAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayVersionId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "status" "EssayFeedbackProviderStatus" NOT NULL DEFAULT 'DISABLED',
    "requestMetadata" JSONB,
    "resultMetadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayFeedbackJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EssayAttempt_userId_status_updatedAt_idx" ON "EssayAttempt"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "EssayAttempt_essayVersionId_status_idx" ON "EssayAttempt"("essayVersionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EssayAttempt_userId_idempotencyKey_key" ON "EssayAttempt"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "EssayAutosave_essayAttemptId_updatedAt_idx" ON "EssayAutosave"("essayAttemptId", "updatedAt");

-- CreateIndex
CREATE INDEX "EssayAutosave_userId_updatedAt_idx" ON "EssayAutosave"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "EssaySelfAssessment_userId_submittedAt_idx" ON "EssaySelfAssessment"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "EssaySelfAssessment_essayVersionId_submittedAt_idx" ON "EssaySelfAssessment"("essayVersionId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EssaySelfAssessment_essayAttemptId_key" ON "EssaySelfAssessment"("essayAttemptId");

-- CreateIndex
CREATE INDEX "EssaySelfAssessmentItem_essayRubricItemId_idx" ON "EssaySelfAssessmentItem"("essayRubricItemId");

-- CreateIndex
CREATE UNIQUE INDEX "EssaySelfAssessmentItem_essaySelfAssessmentId_essayRubricIt_key" ON "EssaySelfAssessmentItem"("essaySelfAssessmentId", "essayRubricItemId");

-- CreateIndex
CREATE INDEX "EssayNote_essayAttemptId_updatedAt_idx" ON "EssayNote"("essayAttemptId", "updatedAt");

-- CreateIndex
CREATE INDEX "EssayNote_userId_updatedAt_idx" ON "EssayNote"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "EssayFeedbackJob_essayAttemptId_status_idx" ON "EssayFeedbackJob"("essayAttemptId", "status");

-- CreateIndex
CREATE INDEX "EssayFeedbackJob_providerKey_status_idx" ON "EssayFeedbackJob"("providerKey", "status");

-- CreateIndex
CREATE INDEX "MasteryEvent_essayAttemptId_idx" ON "MasteryEvent"("essayAttemptId");

-- CreateIndex
CREATE INDEX "MasteryEvent_essayRubricItemId_idx" ON "MasteryEvent"("essayRubricItemId");

-- CreateIndex
CREATE INDEX "ReviewItem_essayAttemptId_idx" ON "ReviewItem"("essayAttemptId");

-- CreateIndex
CREATE INDEX "ReviewItem_essayRubricItemId_idx" ON "ReviewItem"("essayRubricItemId");

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryEvent" ADD CONSTRAINT "MasteryEvent_essayRubricItemId_fkey" FOREIGN KEY ("essayRubricItemId") REFERENCES "EssayRubricItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_essayRubricItemId_fkey" FOREIGN KEY ("essayRubricItemId") REFERENCES "EssayRubricItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAttempt" ADD CONSTRAINT "EssayAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAttempt" ADD CONSTRAINT "EssayAttempt_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAutosave" ADD CONSTRAINT "EssayAutosave_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAutosave" ADD CONSTRAINT "EssayAutosave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayAutosave" ADD CONSTRAINT "EssayAutosave_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySelfAssessment" ADD CONSTRAINT "EssaySelfAssessment_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySelfAssessment" ADD CONSTRAINT "EssaySelfAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySelfAssessment" ADD CONSTRAINT "EssaySelfAssessment_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySelfAssessmentItem" ADD CONSTRAINT "EssaySelfAssessmentItem_essaySelfAssessmentId_fkey" FOREIGN KEY ("essaySelfAssessmentId") REFERENCES "EssaySelfAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySelfAssessmentItem" ADD CONSTRAINT "EssaySelfAssessmentItem_essayRubricItemId_fkey" FOREIGN KEY ("essayRubricItemId") REFERENCES "EssayRubricItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayNote" ADD CONSTRAINT "EssayNote_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayNote" ADD CONSTRAINT "EssayNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayNote" ADD CONSTRAINT "EssayNote_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayFeedbackJob" ADD CONSTRAINT "EssayFeedbackJob_essayAttemptId_fkey" FOREIGN KEY ("essayAttemptId") REFERENCES "EssayAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayFeedbackJob" ADD CONSTRAINT "EssayFeedbackJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssayFeedbackJob" ADD CONSTRAINT "EssayFeedbackJob_essayVersionId_fkey" FOREIGN KEY ("essayVersionId") REFERENCES "EssayVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
