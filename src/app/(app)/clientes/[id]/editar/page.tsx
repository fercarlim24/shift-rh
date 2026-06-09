import { notFound } from "next/navigation";
import { updateOrganizationAction } from "@/app/actions/organizations";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePagePermission("org:write", "/clientes");

  const org = await prisma.organization.findFirst({
    where: { id, archivedAt: null },
  });
  if (!org) notFound();

  return (
    <div>
      <PageHeader title="Editar cliente" description={org.tradeName ?? org.name} />
      <form
        action={updateOrganizationAction}
        className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]"
      >
        <input type="hidden" name="id" value={id} />
        <FormField label="Razão social" name="name" defaultValue={org.name} required />
        <FormField label="Nome fantasia" name="tradeName" defaultValue={org.tradeName} />
        <FormField label="CNPJ" name="cnpj" defaultValue={org.cnpj} />
        <FormField label="Cidade" name="city" defaultValue={org.city} />
        <FormField label="UF" name="region" defaultValue={org.region} />
        <FormField
          label="Status"
          name="status"
          as="select"
          defaultValue={org.status}
          options={[
            { value: "ACTIVE", label: "Ativo" },
            { value: "INACTIVE", label: "Inativo" },
          ]}
        />
        <FormActions cancelHref={`/clientes/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
