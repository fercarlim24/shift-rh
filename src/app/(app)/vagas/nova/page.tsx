import { createJobAction } from "@/app/actions/jobs";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import {
  employmentTypeLabel,
  jobStatusLabel,
  taskPriorityLabel,
} from "@/lib/labels";
import type { EmploymentType, JobStatus, TaskPriority } from "@/generated/prisma/client";

export default async function NovaVagaPage() {
  await requirePagePermission("job:write", "/vagas");

  return (
    <div>
      <PageHeader title="Nova vaga" description="Cadastrar vaga para o cliente ativo." />
      <form action={createJobAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Título" name="title" required />
        <FormField label="Área" name="area" />
        <FormField label="Senioridade" name="seniority" />
        <FormField
          label="Vínculo"
          name="employmentType"
          as="select"
          defaultValue="CLT"
          options={(Object.keys(employmentTypeLabel) as EmploymentType[]).map((k) => ({
            value: k,
            label: employmentTypeLabel[k],
          }))}
        />
        <FormField label="Quantidade" name="quantity" type="number" defaultValue={1} required />
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
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue="OPEN"
          options={(Object.keys(jobStatusLabel) as JobStatus[]).map((k) => ({
            value: k,
            label: jobStatusLabel[k],
          }))}
        />
        <FormField label="Responsável" name="ownerName" />
        <FormActions cancelHref="/vagas" submitLabel="Criar vaga" />
      </form>
    </div>
  );
}
