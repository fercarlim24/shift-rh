import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/session";

export async function getFormOptions(session: Session) {
  const orgId = session.activeOrganizationId;

  const [users, jobs, candidates, onboardings, stages] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { organizationId: orgId },
          { role: { in: ["SHIFT_ADMIN", "SHIFT_CONSULTANT"] } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.jobOpening.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.candidate.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.onboarding.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, employeeName: true },
      orderBy: { employeeName: "asc" },
    }),
    prisma.pipelineStage.findMany({
      where: { organizationId: orgId, archivedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { users, jobs, candidates, onboardings, stages };
}
