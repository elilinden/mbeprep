-- Add server-only review and provenance metadata for imported original question drafts.
ALTER TABLE "QuestionVersion"
ADD COLUMN "batchId" TEXT,
ADD COLUMN "provenance" TEXT,
ADD COLUMN "publicSourceLabel" TEXT,
ADD COLUMN "publishable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "testedIssue" TEXT,
ADD COLUMN "governingRule" TEXT,
ADD COLUMN "application" TEXT,
ADD COLUMN "commonTrap" TEXT,
ADD COLUMN "memoryAid" TEXT,
ADD COLUMN "authorityNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "reviewChecklist" JSONB,
ADD COLUMN "importMetadata" JSONB;

CREATE INDEX "QuestionVersion_batchId_status_idx" ON "QuestionVersion"("batchId", "status");
CREATE INDEX "QuestionVersion_provenance_status_idx" ON "QuestionVersion"("provenance", "status");
