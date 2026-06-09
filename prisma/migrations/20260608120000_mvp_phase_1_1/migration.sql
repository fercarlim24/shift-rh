-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COLLABORATOR';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'ARCHIVED';

-- CreateTable
CREATE TABLE "UserOrganizationAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganizationAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingEvent" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "JobOpening" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "jobOpeningId" TEXT,
ADD COLUMN "candidateId" TEXT,
ADD COLUMN "onboardingId" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "userId" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Onboarding" ADD COLUMN "responsibleId" TEXT,
ADD COLUMN "documents" JSONB,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganizationAccess_userId_organizationId_key" ON "UserOrganizationAccess"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- AddForeignKey
ALTER TABLE "UserOrganizationAccess" ADD CONSTRAINT "UserOrganizationAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationAccess" ADD CONSTRAINT "UserOrganizationAccess_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "Onboarding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingEvent" ADD CONSTRAINT "OnboardingEvent_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "Onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
