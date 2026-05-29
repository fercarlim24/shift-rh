import { updateTaskStatusAction } from "@/app/actions";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate, taskPriorityLabel, taskStatusLabel } from "@/lib/labels";
import type { TaskStatus } from "@/generated/prisma/client";

export default async function TarefasPage() {
  const session = await requireSession();

  const tasks = await prisma.task.findMany({
    where: { organizationId: session.activeOrganizationId },
    include: { assignee: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div>
      <PageHeader
        title="Gestão de tarefas"
        description="Demandas internas por cliente — substitui Monday."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <Card key={status} className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{taskStatusLabel[status]}</h3>
                <Badge tone="neutral">{columnTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 text-xs text-slate-600">{task.description}</p>
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
                    <p className="mt-2 text-xs text-slate-500">
                      {task.assignee?.name ?? "Sem responsável"}
                    </p>
                    {status !== "DONE" ? (
                      <form action={updateTaskStatusAction} className="mt-3">
                        <input type="hidden" name="taskId" value={task.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={status === "TODO" ? "IN_PROGRESS" : "DONE"}
                        />
                        <button
                          type="submit"
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          {status === "TODO" ? "Iniciar" : "Concluir"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
                {columnTasks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">Vazio</p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
