import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type UpdateResult = { count: number };

export async function updateCandidateScoped(
  id: string,
  organizationId: string,
  data: Prisma.CandidateUncheckedUpdateInput,
): Promise<UpdateResult> {
  const found = await prisma.candidate.findFirst({ where: { id, organizationId } });
  if (!found) return { count: 0 };
  await prisma.candidate.update({ where: { id }, data });
  return { count: 1 };
}

export async function updateJobScoped(
  id: string,
  organizationId: string,
  data: Prisma.JobOpeningUncheckedUpdateInput,
): Promise<UpdateResult> {
  const found = await prisma.jobOpening.findFirst({ where: { id, organizationId } });
  if (!found) return { count: 0 };
  await prisma.jobOpening.update({ where: { id }, data });
  return { count: 1 };
}

export async function updateTaskScoped(
  id: string,
  organizationId: string,
  data: Prisma.TaskUncheckedUpdateInput,
): Promise<UpdateResult> {
  const found = await prisma.task.findFirst({ where: { id, organizationId } });
  if (!found) return { count: 0 };
  await prisma.task.update({ where: { id }, data });
  return { count: 1 };
}

export async function updateOnboardingScoped(
  id: string,
  organizationId: string,
  data: Prisma.OnboardingUncheckedUpdateInput,
): Promise<UpdateResult> {
  const found = await prisma.onboarding.findFirst({ where: { id, organizationId } });
  if (!found) return { count: 0 };
  await prisma.onboarding.update({ where: { id }, data });
  return { count: 1 };
}

export async function updateEmployeeScoped(
  id: string,
  organizationId: string,
  data: Prisma.EmployeeUncheckedUpdateInput,
): Promise<UpdateResult> {
  const found = await prisma.employee.findFirst({ where: { id, organizationId } });
  if (!found) return { count: 0 };
  await prisma.employee.update({ where: { id }, data });
  return { count: 1 };
}
