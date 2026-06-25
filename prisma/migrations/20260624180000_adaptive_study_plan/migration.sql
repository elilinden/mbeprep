-- CreateEnum
CREATE TYPE "StudyTaskType" AS ENUM ('AUDIO', 'QUESTION_SET', 'MIXED_QUESTION_SET', 'REVIEW', 'ESSAY_FULL', 'ESSAY_OUTLINE', 'SIMULATION', 'REST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StudyTaskStatus" AS ENUM ('TODO', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PlanGenerationTrigger" AS ENUM ('ONBOARDING', 'AVAILABILITY_CHANGE', 'NIGHTLY', 'DIAGNOSTIC', 'SIMULATION', 'MISSED_TASKS', 'EXPLICIT_REQUEST');

-- CreateEnum
CREATE TYPE "PlanGenerationStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "examTrackCode" "ExamTrackCode" NOT NULL,
    "timeZone" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "algorithmVersion" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "unavailableDates" TEXT[],
    "unrealisticWarning" TEXT,
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyDay" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "availableMinutes" INTEGER NOT NULL,
    "scheduledMinutes" INTEGER NOT NULL DEFAULT 0,
    "overloadMinutes" INTEGER NOT NULL DEFAULT 0,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTask" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "studyDayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "StudyTaskType" NOT NULL,
    "status" "StudyTaskStatus" NOT NULL DEFAULT 'TODO',
    "title" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "relatedContentKind" "ContentKind",
    "relatedContentId" TEXT,
    "relatedContentLabel" TEXT,
    "relatedTopicId" TEXT,
    "relatedTopicLabel" TEXT,
    "relatedSubject" TEXT,
    "whyAssigned" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "allowOverload" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanGenerationRun" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT,
    "userId" TEXT NOT NULL,
    "trigger" "PlanGenerationTrigger" NOT NULL,
    "status" "PlanGenerationStatus" NOT NULL DEFAULT 'RUNNING',
    "seed" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "outputSummaryJson" JSONB,
    "warning" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlan_userId_status_startsOn_idx" ON "StudyPlan"("userId", "status", "startsOn");

-- CreateIndex
CREATE INDEX "StudyPlan_examDate_idx" ON "StudyPlan"("examDate");

-- CreateIndex
CREATE INDEX "StudyDay_studyPlanId_date_idx" ON "StudyDay"("studyPlanId", "date");

-- CreateIndex
CREATE INDEX "StudyDay_date_idx" ON "StudyDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StudyDay_studyPlanId_date_key" ON "StudyDay"("studyPlanId", "date");

-- CreateIndex
CREATE INDEX "StudyTask_userId_status_dueDate_idx" ON "StudyTask"("userId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "StudyTask_studyPlanId_priority_idx" ON "StudyTask"("studyPlanId", "priority");

-- CreateIndex
CREATE INDEX "StudyTask_studyDayId_priority_idx" ON "StudyTask"("studyDayId", "priority");

-- CreateIndex
CREATE INDEX "StudyTask_relatedTopicId_idx" ON "StudyTask"("relatedTopicId");

-- CreateIndex
CREATE INDEX "PlanGenerationRun_userId_startedAt_idx" ON "PlanGenerationRun"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PlanGenerationRun_studyPlanId_startedAt_idx" ON "PlanGenerationRun"("studyPlanId", "startedAt");

-- CreateIndex
CREATE INDEX "PlanGenerationRun_trigger_status_idx" ON "PlanGenerationRun"("trigger", "status");

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyDay" ADD CONSTRAINT "StudyDay_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_studyDayId_fkey" FOREIGN KEY ("studyDayId") REFERENCES "StudyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanGenerationRun" ADD CONSTRAINT "PlanGenerationRun_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanGenerationRun" ADD CONSTRAINT "PlanGenerationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
