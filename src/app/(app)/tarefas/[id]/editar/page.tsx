import { notFound } from "next/navigation";
import { updateTaskAction } from "@/app/actions/tasks";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";

export default async function EditarTarefaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePagePermission("task:write", `/tarefas/${id}`);

  const task = await prisma.task.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!task) notFound();

  const { users, jobs, candidates, onboardings } = await getFormOptions(session);
  const dueDate = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "";

  return (
    <div>
      <PageHeader title="Editar tarefa" description={task.title} />
      <form action={updateTaskAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Título" name="title" defaultValue={task.title} required />
        <FormField label="Descrição" name="description" as="textarea" defaultValue={task.description} />
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue={task.status}
          options={(Object.keys(taskStatusLabel) as TaskStatus[])
            .filter((s) => s !== "ARCHIVED")
            .map((k) => ({ value: k, label: taskStatusLabel[k] }))}
        />
        <FormField
          label="Prioridade"
          name="priority"
          as="select"
          defaultValue={task.priority}
          options={(Object.keys(taskPriorityLabel) as TaskPriority[]).map((k) => ({
            value: k,
            label: taskPriorityLabel[k],
          }))}
        />
        <FormField label="Prazo" name="dueDate" type="date" defaultValue={dueDate} />
        <FormField
          label="Responsável"
          name="assigneeId"
          as="select"
          defaultValue={task.assigneeId ?? ""}
          options={[
            { value: "", label: "Sem responsável" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <FormField
          label="Vaga (opcional)"
          name="jobOpeningId"
          as="select"
          defaultValue={task.jobOpeningId ?? ""}
          options={[
            { value: "", label: "Nenhuma" },
            ...jobs.map((j) => ({ value: j.id, label: j.title })),
          ]}
        />
        <FormField
          label="Candidato (opcional)"
          name="candidateId"
          as="select"
          defaultValue={task.candidateId ?? ""}
          options={[
            { value: "", label: "Nenhum" },
            ...candidates.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FormField
          label="Admissão (opcional)"
          name="onboardingId"
          as="select"
          defaultValue={task.onboardingId ?? ""}
          options={[
            { value: "", label: "Nenhuma" },
            ...onboardings.map((o) => ({ value: o.id, label: o.employeeName })),
          ]}
        />
        <FormActions cancelHref={`/tarefas/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
