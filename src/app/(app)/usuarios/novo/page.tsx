import { createUserAction } from "@/app/actions/users";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/labels";
import type { UserRole } from "@/generated/prisma/client";

export default async function NovoUsuarioPage() {
  await requirePagePermission("user:write", "/usuarios");

  const organizations = await prisma.organization.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, tradeName: true },
  });

  return (
    <div>
      <PageHeader title="Novo usuário" description="Criar conta com senha bcrypt." />
      <form action={createUserAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <FormField label="Nome" name="name" required />
        <FormField label="E-mail" name="email" type="email" required />
        <FormField label="Senha" name="password" type="password" required />
        <FormField
          label="Papel"
          name="role"
          as="select"
          defaultValue="SHIFT_CONSULTANT"
          options={(Object.keys(roleLabel) as UserRole[]).map((k) => ({
            value: k,
            label: roleLabel[k],
          }))}
        />
        <FormField
          label="Organização (opcional)"
          name="organizationId"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "Nenhuma" },
            ...organizations.map((o) => ({
              value: o.id,
              label: o.tradeName ?? o.name,
            })),
          ]}
        />
        <FormActions cancelHref="/usuarios" submitLabel="Criar usuário" />
      </form>
    </div>
  );
}
