import { createOnboardingAction } from "@/app/actions/onboardings";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";
import { employmentTypeLabel } from "@/lib/labels";
import type { EmploymentType } from "@/generated/prisma/client";

export default async function NovaAdmissaoPage() {
  const session = await requirePagePermission("onboarding:write", "/admissoes");
  const { users, candidates } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nova admissão" description="Iniciar processo de onboarding." />
      <form action={createOnboardingAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Nome do colaborador" name="employeeName" required />
        <FormField
          label="Tipo de vínculo"
          name="employmentType"
          as="select"
          defaultValue="CLT"
          options={(Object.keys(employmentTypeLabel) as EmploymentType[])
            .filter((k) => k !== "BOTH")
            .map((k) => ({ value: k, label: employmentTypeLabel[k] }))}
        />
        <FormField
          label="Candidato vinculado (opcional)"
          name="candidateId"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "Nenhum" },
            ...candidates.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FormField
          label="Responsável"
          name="responsibleId"
          as="select"
          defaultValue={session.user.id}
          options={users.map((u) => ({ value: u.id, label: u.name }))}
        />
        <FormActions cancelHref="/admissoes" submitLabel="Criar admissão" />
      </form>
    </div>
  );
}
