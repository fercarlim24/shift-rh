import { notFound } from "next/navigation";
import { updateJobAction } from "@/app/actions/jobs";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import {
  employmentTypeLabel,
  jobStatusLabel,
  taskPriorityLabel,
} from "@/lib/labels";
import type { EmploymentType, JobStatus, TaskPriority } from "@/generated/prisma/client";

export default async function EditarVagaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePagePermission("job:write", `/vagas/${id}`);

  const job = await prisma.jobOpening.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!job) notFound();

  return (
    <div>
      <PageHeader title="Editar vaga" description={job.title} />
      <form action={updateJobAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Título" name="title" defaultValue={job.title} required />
        <FormField label="Área" name="area" defaultValue={job.area} />
        <FormField label="Senioridade" name="seniority" defaultValue={job.seniority} />
        <FormField
          label="Vínculo"
          name="employmentType"
          as="select"
          defaultValue={job.employmentType}
          options={(Object.keys(employmentTypeLabel) as EmploymentType[]).map((k) => ({
            value: k,
            label: employmentTypeLabel[k],
          }))}
        />
        <FormField label="Quantidade" name="quantity" type="number" defaultValue={job.quantity} required />
        <FormField
          label="Prioridade"
          name="priority"
          as="select"
          defaultValue={job.priority}
          options={(Object.keys(taskPriorityLabel) as TaskPriority[]).map((k) => ({
            value: k,
            label: taskPriorityLabel[k],
          }))}
        />
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue={job.status}
          options={(Object.keys(jobStatusLabel) as JobStatus[]).map((k) => ({
            value: k,
            label: jobStatusLabel[k],
          }))}
        />
        <FormField label="Responsável" name="ownerName" defaultValue={job.ownerName} />
        <FormActions cancelHref={`/vagas/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
