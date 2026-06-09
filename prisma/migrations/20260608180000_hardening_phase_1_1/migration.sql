-- AlterTable User
ALTER TABLE "User" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable PipelineStage
ALTER TABLE "PipelineStage" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "OnboardingDocument" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT,
    "contentBase64" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OnboardingDocument" ADD CONSTRAINT "OnboardingDocument_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "Onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingDocument" ADD CONSTRAINT "OnboardingDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
