import { KanbanBoard } from "@/components/kanban-board";
import { PageHeader } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function RecrutamentoPage() {
  const session = await requireSession();
  const orgId = session.activeOrganizationId;

  const [stages, candidates, jobs] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { organizationId: orgId },
      orderBy: { order: "asc" },
    }),
    prisma.candidate.findMany({
      where: { organizationId: orgId },
      include: { jobOpening: true, stage: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.jobOpening.findMany({
      where: { organizationId: orgId, status: "OPEN" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Recrutamento & Seleção"
        description="Pipeline kanban com etapas configuráveis — substitui Excel + Canva."
      />

      <KanbanBoard stages={stages} candidates={candidates} jobs={jobs} />
    </div>
  );
}
