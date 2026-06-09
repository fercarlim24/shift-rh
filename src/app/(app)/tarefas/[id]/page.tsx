import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveTaskAction, updateTaskStatusAction } from "@/app/actions/tasks";
import { Badge, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnLink, btnSecondary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate, taskPriorityLabel, taskStatusLabel } from "@/lib/labels";

export default async function TarefaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();

  const where: Record<string, unknown> = {
    id,
    organizationId: session.activeOrganizationId,
    archivedAt: null,
  };
  if (session.user.role === "COLLABORATOR") {
    where.assigneeId = session.user.id;
  }

  const task = await prisma.task.findFirst({
    where,
    include: {
      assignee: true,
      jobOpening: true,
      candidate: true,
      onboarding: true,
      organization: { select: { tradeName: true, name: true } },
    },
  });
  if (!task) notFound();

  const canWrite = hasPermission(session.user.role, "task:write");

  return (
    <div>
      <PageHeader title={task.title} description={task.organization.tradeName ?? task.organization.name}>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Link href={`/tarefas/${id}/editar`} className={btnSecondary}>
              Editar
            </Link>
          ) : null}
          {canWrite && task.status !== "DONE" ? (
            <form action={updateTaskStatusAction}>
              <input type="hidden" name="taskId" value={id} />
              <input
                type="hidden"
                name="status"
                value={task.status === "TODO" ? "IN_PROGRESS" : "DONE"}
              />
              <button type="submit" className={btnSecondary}>
                {task.status === "TODO" ? "Iniciar" : "Concluir"}
              </button>
            </form>
          ) : null}
          {hasPermission(session.user.role, "task:archive") ? (
            <ConfirmForm
              action={archiveTaskAction}
              id={id}
              confirmMessage="Arquivar esta tarefa?"
              label="Arquivar"
            />
          ) : null}
        </div>
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <DetailCard>
        <DetailGrid>
          <DetailItem
            label="Status"
            value={<Badge>{taskStatusLabel[task.status]}</Badge>}
          />
          <DetailItem label="Prioridade" value={taskPriorityLabel[task.priority]} />
          <DetailItem label="Responsável" value={task.assignee?.name ?? "—"} />
          <DetailItem label="Prazo" value={formatDate(task.dueDate)} />
          <DetailItem
            label="Vaga vinculada"
            value={
              task.jobOpening ? (
                <Link href={`/vagas/${task.jobOpening.id}`} className={btnLink}>
                  {task.jobOpening.title}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailItem
            label="Candidato vinculado"
            value={
              task.candidate ? (
                <Link href={`/candidatos/${task.candidate.id}`} className={btnLink}>
                  {task.candidate.name}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailItem
            label="Admissão vinculada"
            value={
              task.onboarding ? (
                <Link href={`/admissoes/${task.onboarding.id}`} className={btnLink}>
                  {task.onboarding.employeeName}
                </Link>
              ) : (
                "—"
              )
            }
          />
          {task.description ? (
            <DetailItem label="Descrição" value={task.description} />
          ) : null}
        </DetailGrid>
      </DetailCard>

      <div className="mt-4">
        <Link href="/tarefas" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para tarefas
        </Link>
      </div>
    </div>
  );
}
