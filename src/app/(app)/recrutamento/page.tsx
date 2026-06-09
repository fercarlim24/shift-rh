import Link from "next/link";
import { KanbanBoard } from "@/components/kanban-board";
import { PageHeader } from "@/components/app-shell";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function RecrutamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const orgId = session.activeOrganizationId;
  const canWrite = hasPermission(session.user.role, "pipeline:move");

  const [stages, candidates, jobs] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { organizationId: orgId, archivedAt: null },
      orderBy: { order: "asc" },
    }),
    prisma.candidate.findMany({
      where: { organizationId: orgId, archivedAt: null },
      include: { jobOpening: true, stage: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.jobOpening.findMany({
      where: { organizationId: orgId, status: "OPEN", archivedAt: null },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div>
      <FlashMessage success={params.success} error={params.error} />

      <PageHeader
        title="Recrutamento & Seleção"
        description="Pipeline kanban com etapas configuráveis — substitui Excel + Canva."
      >
        {canWrite ? (
          <Link href="/candidatos/novo?returnTo=/recrutamento" className={btnPrimary}>
            Novo candidato
          </Link>
        ) : null}
      </PageHeader>

      {stages.length === 0 ? (
        <EmptyState title="Pipeline não configurado" description="Cadastre etapas via seed ou novo cliente." />
      ) : (
        <KanbanBoard
          stages={stages}
          candidates={candidates}
          jobs={jobs}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
