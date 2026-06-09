import { notFound } from "next/navigation";
import { updateOnboardingAction } from "@/app/actions/onboardings";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { employmentTypeLabel, onboardingStatusLabel } from "@/lib/labels";
import type { EmploymentType, OnboardingStatus } from "@/generated/prisma/client";

export default async function EditarAdmissaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePagePermission("onboarding:write", `/admissoes/${id}`);

  const onboarding = await prisma.onboarding.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!onboarding) notFound();

  const { users, candidates } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Editar admissão" description={onboarding.employeeName} />
      <form action={updateOnboardingAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Nome do colaborador" name="employeeName" defaultValue={onboarding.employeeName} required />
        <FormField
          label="Tipo de vínculo"
          name="employmentType"
          as="select"
          defaultValue={onboarding.employmentType}
          options={(Object.keys(employmentTypeLabel) as EmploymentType[])
            .filter((k) => k !== "BOTH")
            .map((k) => ({ value: k, label: employmentTypeLabel[k] }))}
        />
        <FormField
          label="Status do processo"
          name="status"
          as="select"
          defaultValue={onboarding.status}
          options={(Object.keys(onboardingStatusLabel) as OnboardingStatus[]).map((k) => ({
            value: k,
            label: onboardingStatusLabel[k],
          }))}
        />
        <FormField
          label="Candidato vinculado"
          name="candidateId"
          as="select"
          defaultValue={onboarding.candidateId ?? ""}
          options={[
            { value: "", label: "Nenhum" },
            ...candidates.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FormField
          label="Responsável"
          name="responsibleId"
          as="select"
          defaultValue={onboarding.responsibleId ?? session.user.id}
          options={users.map((u) => ({ value: u.id, label: u.name }))}
        />
        <FormField
          label="Nota de documento (placeholder)"
          name="documentNotes"
          as="textarea"
          placeholder="Ex: Contrato CLT enviado por e-mail..."
        />
        <FormActions cancelHref={`/admissoes/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
