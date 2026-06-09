import { createOrganizationAction } from "@/app/actions/organizations";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePageCreateOrganization } from "@/lib/page-guards";

export default async function NovoClientePage() {
  await requirePageCreateOrganization("/clientes");

  return (
    <div>
      <PageHeader title="Novo cliente" description="Cadastrar nova organização multi-tenant." />
      <form action={createOrganizationAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Razão social" name="name" required />
        <FormField label="Nome fantasia" name="tradeName" />
        <FormField label="CNPJ" name="cnpj" />
        <FormField label="Cidade" name="city" />
        <FormField label="UF" name="region" />
        <FormActions cancelHref="/clientes" submitLabel="Criar cliente" />
      </form>
    </div>
  );
}
