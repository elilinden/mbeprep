-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRoleCode" AS ENUM ('ADMIN', 'LEARNER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "ExamTrackCode" AS ENUM ('LEGACY_UBE', 'NEXTGEN_UBE', 'STATE_SPECIFIC');

-- CreateEnum
CREATE TYPE "TaxonomyNodeType" AS ENUM ('SUBJECT', 'CATEGORY', 'SUBTOPIC', 'RULE', 'SKILL');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LegalContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "StudyPlan" DROP CONSTRAINT "StudyPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "PracticeAttempt" DROP CONSTRAINT "PracticeAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "AudioSession" DROP CONSTRAINT "AudioSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "EssaySubmission" DROP CONSTRAINT "EssaySubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
ADD COLUMN     "status" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "StudyPlan";

-- DropTable
DROP TABLE "PracticeAttempt";

-- DropTable
DROP TABLE "AudioSession";

-- DropTable
DROP TABLE "EssaySubmission";

-- DropTable
DROP TABLE "AuditEvent";

-- DropEnum
DROP TYPE "StudyPlanStatus";

-- DropEnum
DROP TYPE "AttemptStatus";

-- DropEnum
DROP TYPE "EssayStatus";

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRoleCode" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetJurisdiction" TEXT NOT NULL,
    "targetExamDate" TIMESTAMP(3),
    "selectedExamVersionId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamTrack" (
    "id" TEXT NOT NULL,
    "code" "ExamTrackCode" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionExamVersion" (
    "id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "examTrackId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JurisdictionExamVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyNode" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodeType" "TaxonomyNodeType" NOT NULL,
    "parentId" TEXT,
    "examTrackId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "taxonomyNodeId" TEXT,
    "title" TEXT NOT NULL,
    "status" "LegalContentStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "LegalContentStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "contentBody" TEXT,
    "contentSourceId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentLicense" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "copyrightOwner" TEXT NOT NULL,
    "allowedUses" TEXT[],
    "attribution" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "attribution" TEXT,
    "status" "LegalContentStatus" NOT NULL DEFAULT 'DRAFT',
    "dataClassification" TEXT NOT NULL DEFAULT 'DEMO_NOT_FOR_PUBLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRole_role_status_idx" ON "UserRole"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");

-- CreateIndex
CREATE INDEX "LearnerProfile_targetJurisdiction_targetExamDate_idx" ON "LearnerProfile"("targetJurisdiction", "targetExamDate");

-- CreateIndex
CREATE INDEX "LearnerProfile_status_idx" ON "LearnerProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamTrack_code_key" ON "ExamTrack"("code");

-- CreateIndex
CREATE INDEX "ExamTrack_status_idx" ON "ExamTrack"("status");

-- CreateIndex
CREATE INDEX "JurisdictionExamVersion_jurisdiction_effectiveFrom_effectiv_idx" ON "JurisdictionExamVersion"("jurisdiction", "effectiveFrom", "effectiveTo", "status");

-- CreateIndex
CREATE INDEX "JurisdictionExamVersion_examTrackId_status_idx" ON "JurisdictionExamVersion"("examTrackId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JurisdictionExamVersion_jurisdiction_examTrackId_effectiveF_key" ON "JurisdictionExamVersion"("jurisdiction", "examTrackId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TaxonomyNode_parentId_sortOrder_idx" ON "TaxonomyNode"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "TaxonomyNode_nodeType_status_idx" ON "TaxonomyNode"("nodeType", "status");

-- CreateIndex
CREATE INDEX "TaxonomyNode_effectiveFrom_effectiveTo_status_idx" ON "TaxonomyNode"("effectiveFrom", "effectiveTo", "status");

-- CreateIndex
CREATE INDEX "TaxonomyNode_examTrackId_status_idx" ON "TaxonomyNode"("examTrackId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyNode_key_effectiveFrom_key" ON "TaxonomyNode"("key", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyNode_parentId_slug_effectiveFrom_key" ON "TaxonomyNode"("parentId", "slug", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_key_key" ON "Rule"("key");

-- CreateIndex
CREATE INDEX "Rule_taxonomyNodeId_status_idx" ON "Rule"("taxonomyNodeId", "status");

-- CreateIndex
CREATE INDEX "Rule_status_idx" ON "Rule"("status");

-- CreateIndex
CREATE INDEX "RuleVersion_ruleId_status_effectiveFrom_effectiveTo_idx" ON "RuleVersion"("ruleId", "status", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "RuleVersion_contentSourceId_idx" ON "RuleVersion"("contentSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleVersion_ruleId_version_key" ON "RuleVersion"("ruleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RuleVersion_ruleId_effectiveFrom_key" ON "RuleVersion"("ruleId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ContentLicense_key_key" ON "ContentLicense"("key");

-- CreateIndex
CREATE INDEX "ContentLicense_status_expiresAt_idx" ON "ContentLicense"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_key_key" ON "ContentSource"("key");

-- CreateIndex
CREATE INDEX "ContentSource_licenseId_status_idx" ON "ContentSource"("licenseId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_selectedExamVersionId_fkey" FOREIGN KEY ("selectedExamVersionId") REFERENCES "JurisdictionExamVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionExamVersion" ADD CONSTRAINT "JurisdictionExamVersion_examTrackId_fkey" FOREIGN KEY ("examTrackId") REFERENCES "ExamTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_examTrackId_fkey" FOREIGN KEY ("examTrackId") REFERENCES "ExamTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_contentSourceId_fkey" FOREIGN KEY ("contentSourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "ContentLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
