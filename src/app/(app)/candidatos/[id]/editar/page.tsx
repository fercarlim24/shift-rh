import { notFound } from "next/navigation";
import { updateCandidateAction } from "@/app/actions/candidates";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";

export default async function EditarCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePagePermission("candidate:write", `/candidatos/${id}`);

  const candidate = await prisma.candidate.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!candidate) notFound();

  const { users, jobs, stages } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Editar candidato" description={candidate.name} />
      <form action={updateCandidateAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Nome" name="name" defaultValue={candidate.name} required />
        <FormField label="E-mail" name="email" type="email" defaultValue={candidate.email} />
        <FormField label="Telefone" name="phone" defaultValue={candidate.phone} />
        <FormField label="Origem" name="source" defaultValue={candidate.source} />
        <FormField
          label="Vaga"
          name="jobOpeningId"
          as="select"
          defaultValue={candidate.jobOpeningId ?? ""}
          options={[
            { value: "", label: "Sem vaga" },
            ...jobs.map((j) => ({ value: j.id, label: j.title })),
          ]}
        />
        <FormField
          label="Etapa"
          name="stageId"
          as="select"
          defaultValue={candidate.stageId}
          options={stages.map((s) => ({ value: s.id, label: s.name }))}
        />
        <FormField
          label="Responsável"
          name="ownerId"
          as="select"
          defaultValue={candidate.ownerId ?? ""}
          options={[
            { value: "", label: "Sem responsável" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <FormField label="Observações" name="notes" as="textarea" defaultValue={candidate.notes} />
        <FormActions cancelHref={`/candidatos/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
