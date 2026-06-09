import { createTaskAction } from "@/app/actions/tasks";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";

export default async function NovaTarefaPage() {
  const session = await requirePagePermission("task:write", "/tarefas");
  const { users, jobs, candidates, onboardings } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nova tarefa" description="Criar demanda interna para o cliente ativo." />
      <form action={createTaskAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Título" name="title" required />
        <FormField label="Descrição" name="description" as="textarea" />
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue="TODO"
          options={(Object.keys(taskStatusLabel) as TaskStatus[])
            .filter((s) => s !== "ARCHIVED")
            .map((k) => ({ value: k, label: taskStatusLabel[k] }))}
        />
        <FormField
          label="Prioridade"
          name="priority"
          as="select"
          defaultValue="MEDIUM"
          options={(Object.keys(taskPriorityLabel) as TaskPriority[]).map((k) => ({
            value: k,
            label: taskPriorityLabel[k],
          }))}
        />
        <FormField label="Prazo" name="dueDate" type="date" />
        <FormField
          label="Responsável"
          name="assigneeId"
          as="select"
          defaultValue={session.user.id}
          options={[
            { value: "", label: "Sem responsável" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <FormField
          label="Vaga (opcional)"
          name="jobOpeningId"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "Nenhuma" },
            ...jobs.map((j) => ({ value: j.id, label: j.title })),
          ]}
        />
        <FormField
          label="Candidato (opcional)"
          name="candidateId"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "Nenhum" },
            ...candidates.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FormField
          label="Admissão (opcional)"
          name="onboardingId"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "Nenhuma" },
            ...onboardings.map((o) => ({ value: o.id, label: o.employeeName })),
          ]}
        />
        <FormActions cancelHref="/tarefas" submitLabel="Criar tarefa" />
      </form>
    </div>
  );
}
