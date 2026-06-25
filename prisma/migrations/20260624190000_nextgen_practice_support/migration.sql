-- AlterEnum
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'SELECT_TWO';
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'SHORT_ANSWER';
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'MEDIUM_ANSWER';
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'INTEGRATED_SET';
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'STANDARD_PERFORMANCE_TASK';
ALTER TYPE "QuestionFormat" ADD VALUE IF NOT EXISTS 'LEGAL_RESEARCH_PERFORMANCE_TASK';

-- AlterTable
ALTER TABLE "QuestionVersion"
ADD COLUMN "integratedSetId" TEXT,
ADD COLUMN "commonFactScenario" TEXT,
ADD COLUMN "attachedResources" JSONB,
ADD COLUMN "exhibits" JSONB,
ADD COLUMN "responseAreas" JSONB,
ADD COLUMN "setLevelTimingSeconds" INTEGER,
ADD COLUMN "performanceTaskLibrary" JSONB,
ADD COLUMN "scoringRubric" JSONB,
ADD COLUMN "lawyeringSkillTopicId" TEXT,
ADD COLUMN "simulationBlueprintKey" TEXT;

-- AlterTable
ALTER TABLE "QuestionAttempt"
ADD COLUMN "earnedPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "scoreScale" TEXT NOT NULL DEFAULT 'LEGACY_BINARY',
ADD COLUMN "writtenResponses" JSONB;

-- CreateTable
CREATE TABLE "SimulationBlueprint" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "examTrackId" TEXT NOT NULL,
    "administrationDate" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "blueprint" JSONB NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionVersion_lawyeringSkillTopicId_status_idx" ON "QuestionVersion"("lawyeringSkillTopicId", "status");
CREATE INDEX "QuestionVersion_examTrackId_format_status_idx" ON "QuestionVersion"("examTrackId", "format", "status");
CREATE INDEX "QuestionVersion_integratedSetId_idx" ON "QuestionVersion"("integratedSetId");
CREATE INDEX "QuestionVersion_simulationBlueprintKey_idx" ON "QuestionVersion"("simulationBlueprintKey");
CREATE INDEX "SimulationBlueprint_examTrackId_administrationDate_status_idx" ON "SimulationBlueprint"("examTrackId", "administrationDate", "status");
CREATE INDEX "SimulationBlueprint_status_idx" ON "SimulationBlueprint"("status");
CREATE UNIQUE INDEX "SimulationBlueprint_key_version_key" ON "SimulationBlueprint"("key", "version");
CREATE UNIQUE INDEX "SimulationBlueprint_examTrackId_administrationDate_version_key" ON "SimulationBlueprint"("examTrackId", "administrationDate", "version");

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_lawyeringSkillTopicId_fkey" FOREIGN KEY ("lawyeringSkillTopicId") REFERENCES "TaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SimulationBlueprint" ADD CONSTRAINT "SimulationBlueprint_examTrackId_fkey" FOREIGN KEY ("examTrackId") REFERENCES "ExamTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
