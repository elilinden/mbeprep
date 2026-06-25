-- CreateEnum
CREATE TYPE "PreferredTextSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');

-- ReplaceEnum
CREATE TYPE "UserRoleCode_new" AS ENUM ('STUDENT', 'EDITOR', 'ADMIN', 'REVIEWER');
ALTER TABLE "UserRole" ALTER COLUMN "role" TYPE "UserRoleCode_new" USING (
  CASE "role"::text
    WHEN 'LEARNER' THEN 'STUDENT'
    ELSE "role"::text
  END
)::"UserRoleCode_new";
DROP TYPE "UserRoleCode";
ALTER TYPE "UserRoleCode_new" RENAME TO "UserRoleCode";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT,
ADD COLUMN "emailVerified" TIMESTAMP(3),
ADD COLUMN "image" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN "resolvedTrackConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "firstTimeTaker" BOOLEAN,
ADD COLUMN "timeZone" TEXT,
ADD COLUMN "studyStartDate" TIMESTAMP(3),
ADD COLUMN "availableDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "availableMinutesByDay" JSONB,
ADD COLUMN "restDay" TEXT,
ADD COLUMN "extendedTimeMultiplier" DOUBLE PRECISION,
ADD COLUMN "preferredTextSize" "PreferredTextSize" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "highContrastPreference" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reducedMotionPreference" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LearnerProfile" ALTER COLUMN "targetJurisdiction" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
