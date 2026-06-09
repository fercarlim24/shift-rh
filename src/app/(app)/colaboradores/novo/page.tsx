import { createEmployeeAction } from "@/app/actions/employees";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { employmentTypeLabel } from "@/lib/labels";
import { requirePagePermission } from "@/lib/page-guards";
import type { EmploymentType } from "@/generated/prisma/client";

export default async function NovoColaboradorPage() {
  await requirePagePermission("employee:write", "/colaboradores");

  return (
    <div>
      <PageHeader title="Novo colaborador" description="Cadastrar membro da equipe." />
      <form action={createEmployeeAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Nome" name="name" required />
        <FormField label="E-mail" name="email" type="email" />
        <FormField label="Documento (CPF/CNPJ)" name="document" />
        <FormField
          label="Vínculo"
          name="employmentType"
          as="select"
          defaultValue="CLT"
          options={(Object.keys(employmentTypeLabel) as EmploymentType[])
            .filter((k) => k !== "BOTH")
            .map((k) => ({ value: k, label: employmentTypeLabel[k] }))}
        />
        <FormField label="Cargo" name="role" />
        <FormField label="Área" name="area" />
        <FormField label="Data de início" name="startDate" type="date" />
        <FormField label="Empresa PJ" name="pjCompanyName" />
        <FormField label="CNPJ PJ" name="pjCnpj" />
        <FormActions cancelHref="/colaboradores" submitLabel="Criar colaborador" />
      </form>
    </div>
  );
}
