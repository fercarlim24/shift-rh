import { notFound } from "next/navigation";
import { updateEmployeeAction } from "@/app/actions/employees";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { employmentTypeLabel } from "@/lib/labels";
import type { EmploymentType } from "@/generated/prisma/client";

export default async function EditarColaboradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePagePermission("employee:write", `/colaboradores/${id}`);

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!employee) notFound();

  const startDate = employee.startDate ? employee.startDate.toISOString().slice(0, 10) : "";

  return (
    <div>
      <PageHeader title="Editar colaborador" description={employee.name} />
      <form action={updateEmployeeAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Nome" name="name" defaultValue={employee.name} required />
        <FormField label="E-mail" name="email" type="email" defaultValue={employee.email} />
        <FormField label="Documento" name="document" defaultValue={employee.document} />
        <FormField
          label="Vínculo"
          name="employmentType"
          as="select"
          defaultValue={employee.employmentType}
          options={(Object.keys(employmentTypeLabel) as EmploymentType[])
            .filter((k) => k !== "BOTH")
            .map((k) => ({ value: k, label: employmentTypeLabel[k] }))}
        />
        <FormField label="Cargo" name="role" defaultValue={employee.role} />
        <FormField label="Área" name="area" defaultValue={employee.area} />
        <FormField label="Data de início" name="startDate" type="date" defaultValue={startDate} />
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue={employee.status}
          options={[
            { value: "ACTIVE", label: "Ativo" },
            { value: "INACTIVE", label: "Inativo" },
          ]}
        />
        <FormField label="Empresa PJ" name="pjCompanyName" defaultValue={employee.pjCompanyName} />
        <FormField label="CNPJ PJ" name="pjCnpj" defaultValue={employee.pjCnpj} />
        <FormActions cancelHref={`/colaboradores/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
