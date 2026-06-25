-- CreateEnum
CREATE TYPE "PracticeSessionMode" AS ENUM ('LEARNING', 'EXAM', 'CUSTOM', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "PracticeSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PracticeFeedbackMode" AS ENUM ('IMMEDIATE', 'END_OF_SET');

-- CreateEnum
CREATE TYPE "PracticeTimingMode" AS ENUM ('TIMED', 'UNTIMED');

-- CreateEnum
CREATE TYPE "AttemptConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MistakeTagCode" AS ENUM ('MISREAD_FACTS', 'MISREAD_CALL', 'RULE_CONFUSION', 'TIMING_PRESSURE', 'SECOND_GUESSING', 'CONTENT_GAP');

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PracticeSessionMode" NOT NULL,
    "status" "PracticeSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "feedbackMode" "PracticeFeedbackMode" NOT NULL DEFAULT 'END_OF_SET',
    "timingMode" "PracticeTimingMode" NOT NULL DEFAULT 'UNTIMED',
    "examTrackCode" "ExamTrackCode",
    "subject" TEXT,
    "category" TEXT,
    "subtopic" TEXT,
    "difficulty" "QuestionDifficulty",
    "questionCount" INTEGER NOT NULL,
    "randomSeed" TEXT NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionQuestion" (
    "id" TEXT NOT NULL,
    "practiceSessionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "choiceOrder" TEXT[],
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" TEXT NOT NULL,
    "practiceSessionId" TEXT NOT NULL,
    "sessionQuestionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTimeMs" INTEGER NOT NULL,
    "confidence" "AttemptConfidence",
    "answerChanges" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptChoice" (
    "id" TEXT NOT NULL,
    "questionAttemptId" TEXT NOT NULL,
    "questionChoiceId" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptMistakeTag" (
    "id" TEXT NOT NULL,
    "questionAttemptId" TEXT NOT NULL,
    "tag" "MistakeTagCode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptMistakeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeSession_userId_status_updatedAt_idx" ON "PracticeSession"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_mode_status_idx" ON "PracticeSession"("mode", "status");

-- CreateIndex
CREATE INDEX "PracticeSession_examTrackCode_subject_category_idx" ON "PracticeSession"("examTrackCode", "subject", "category");

-- CreateIndex
CREATE INDEX "SessionQuestion_questionVersionId_idx" ON "SessionQuestion"("questionVersionId");

-- CreateIndex
CREATE INDEX "SessionQuestion_practiceSessionId_flagged_idx" ON "SessionQuestion"("practiceSessionId", "flagged");

-- CreateIndex
CREATE UNIQUE INDEX "SessionQuestion_practiceSessionId_position_key" ON "SessionQuestion"("practiceSessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SessionQuestion_practiceSessionId_questionVersionId_key" ON "SessionQuestion"("practiceSessionId", "questionVersionId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_submittedAt_idx" ON "QuestionAttempt"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "QuestionAttempt_practiceSessionId_isCorrect_idx" ON "QuestionAttempt"("practiceSessionId", "isCorrect");

-- CreateIndex
CREATE INDEX "QuestionAttempt_questionVersionId_isCorrect_idx" ON "QuestionAttempt"("questionVersionId", "isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttempt_practiceSessionId_idempotencyKey_key" ON "QuestionAttempt"("practiceSessionId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttempt_sessionQuestionId_userId_key" ON "QuestionAttempt"("sessionQuestionId", "userId");

-- CreateIndex
CREATE INDEX "AttemptChoice_questionChoiceId_idx" ON "AttemptChoice"("questionChoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptChoice_questionAttemptId_questionChoiceId_key" ON "AttemptChoice"("questionAttemptId", "questionChoiceId");

-- CreateIndex
CREATE INDEX "AttemptMistakeTag_tag_idx" ON "AttemptMistakeTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptMistakeTag_questionAttemptId_tag_key" ON "AttemptMistakeTag"("questionAttemptId", "tag");

-- CreateIndex
CREATE INDEX "QuestionBookmark_questionVersionId_idx" ON "QuestionBookmark"("questionVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBookmark_userId_questionVersionId_key" ON "QuestionBookmark"("userId", "questionVersionId");

-- CreateIndex
CREATE INDEX "QuestionNote_userId_questionVersionId_updatedAt_idx" ON "QuestionNote"("userId", "questionVersionId", "updatedAt");

-- CreateIndex
CREATE INDEX "QuestionNote_questionVersionId_idx" ON "QuestionNote"("questionVersionId");

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionQuestion" ADD CONSTRAINT "SessionQuestion_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionQuestion" ADD CONSTRAINT "SessionQuestion_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_sessionQuestionId_fkey" FOREIGN KEY ("sessionQuestionId") REFERENCES "SessionQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptChoice" ADD CONSTRAINT "AttemptChoice_questionAttemptId_fkey" FOREIGN KEY ("questionAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptChoice" ADD CONSTRAINT "AttemptChoice_questionChoiceId_fkey" FOREIGN KEY ("questionChoiceId") REFERENCES "QuestionChoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptMistakeTag" ADD CONSTRAINT "AttemptMistakeTag_questionAttemptId_fkey" FOREIGN KEY ("questionAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBookmark" ADD CONSTRAINT "QuestionBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBookmark" ADD CONSTRAINT "QuestionBookmark_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
