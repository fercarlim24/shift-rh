import { prisma } from "@/lib/prisma";

export async function getJobSummary(jobId: string, organizationId: string) {
  const [job, candidates, stages] = await Promise.all([
    prisma.jobOpening.findFirst({
      where: { id: jobId, organizationId, archivedAt: null },
    }),
    prisma.candidate.findMany({
      where: { jobOpeningId: jobId, organizationId, archivedAt: null },
      include: { stage: true },
    }),
    prisma.pipelineStage.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!job) return null;

  const declined = candidates.filter((c) => c.stage.terminalType === "DECLINED");
  const hired = candidates.filter((c) => c.stage.terminalType === "HIRED");
  const active = candidates.filter(
    (c) => c.stage.terminalType !== "DECLINED" && c.stage.terminalType !== "HIRED",
  );

  const byStage = stages.map((stage) => ({
    stage,
    count: candidates.filter((c) => c.stageId === stage.id).length,
  }));

  const advanced = candidates.filter((c) => c.stage.order >= 1).length;

  return {
    job,
    total: candidates.length,
    declined: declined.length,
    hired: hired.length,
    active: active.length,
    advanced,
    byStage,
  };
}
