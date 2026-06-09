import { prisma } from "@/lib/prisma";

export async function validateJobInOrg(jobOpeningId: string | null, organizationId: string) {
  if (!jobOpeningId) return true;
  const job = await prisma.jobOpening.findFirst({
    where: { id: jobOpeningId, organizationId, archivedAt: null },
  });
  return !!job;
}

export async function validateCandidateInOrg(candidateId: string | null, organizationId: string) {
  if (!candidateId) return true;
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, organizationId, archivedAt: null },
  });
  return !!candidate;
}

export async function validateStageInOrg(stageId: string, organizationId: string) {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, organizationId, archivedAt: null },
  });
  return !!stage;
}

export async function validateOnboardingInOrg(onboardingId: string | null, organizationId: string) {
  if (!onboardingId) return true;
  const onboarding = await prisma.onboarding.findFirst({
    where: { id: onboardingId, organizationId, archivedAt: null },
  });
  return !!onboarding;
}
