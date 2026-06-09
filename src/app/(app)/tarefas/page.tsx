import Link from "next/link";
import { archiveTaskAction, updateTaskStatusAction } from "@/app/actions/tasks";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnLink, btnPrimary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate, taskPriorityLabel, taskStatusLabel } from "@/lib/labels";
import type { TaskStatus } from "@/generated/prisma/client";

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    status?: string;
    assigneeId?: string;
    dueBefore?: string;
  }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canWrite = hasPermission(session.user.role, "task:write");

  const where: Record<string, unknown> = {
    organizationId: session.activeOrganizationId,
    archivedAt: null,
  };

  if (session.user.role === "COLLABORATOR") {
    where.assigneeId = session.user.id;
  }
  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.assigneeId) {
    where.assigneeId = params.assigneeId;
  }
  if (params.dueBefore) {
    where.dueDate = { lte: new Date(params.dueBefore) };
  }

  const [tasks, assignees] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: true,
        jobOpening: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true } },
        onboarding: { select: { id: true, employeeName: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { organizationId: session.activeOrganizationId },
          { role: { in: ["SHIFT_ADMIN", "SHIFT_CONSULTANT"] } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div>
      <PageHeader
        title="Gestão de tarefas"
        description="Demandas internas por cliente — substitui Monday."
      >
        {canWrite ? (
          <Link href="/tarefas/nova" className={btnPrimary}>
            Nova tarefa
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Status</label>
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {columns.map((s) => (
                <option key={s} value={s}>
                  {taskStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>
          {session.user.role !== "COLLABORATOR" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Responsável</label>
              <select
                name="assigneeId"
                defaultValue={params.assigneeId ?? ""}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {assignees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Prazo até</label>
            <input
              type="date"
              name="dueBefore"
              defaultValue={params.dueBefore ?? ""}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-zinc-800 px-4 py-2 text-sm text-white transition hover:bg-zinc-900 active:scale-[0.98]"
          >
            Filtrar
          </button>
          <Link href="/tarefas" className="text-sm text-[var(--muted)] hover:underline">
            Limpar
          </Link>
        </form>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa encontrada"
          actionHref={canWrite ? "/tarefas/nova" : undefined}
          actionLabel={canWrite ? "Nova tarefa" : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <Card key={status} className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--foreground)]">{taskStatusLabel[status]}</h3>
                  <Badge tone="neutral">{columnTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <Link href={`/tarefas/${task.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                        {task.title}
                      </Link>
                      {task.description ? (
                        <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{task.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          tone={
                            task.priority === "HIGH"
                              ? "danger"
                              : task.priority === "MEDIUM"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {taskPriorityLabel[task.priority]}
                        </Badge>
                        <Badge tone="info">{formatDate(task.dueDate)}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {task.assignee?.name ?? "Sem responsável"}
                      </p>
                      {task.jobOpening ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">Vaga: {task.jobOpening.title}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {canWrite && status !== "DONE" ? (
                          <form action={updateTaskStatusAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={status === "TODO" ? "IN_PROGRESS" : "DONE"}
                            />
                            <button type="submit" className={btnLink}>
                              {status === "TODO" ? "Iniciar" : "Concluir"}
                            </button>
                          </form>
                        ) : null}
                        {canWrite ? (
                          <Link href={`/tarefas/${task.id}/editar`} className={btnLink}>
                            Editar
                          </Link>
                        ) : null}
                        {hasPermission(session.user.role, "task:archive") ? (
                          <ConfirmForm
                            action={archiveTaskAction}
                            id={task.id}
                            confirmMessage="Arquivar esta tarefa?"
                            label="Arquivar"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--muted)]">Vazio</p>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
