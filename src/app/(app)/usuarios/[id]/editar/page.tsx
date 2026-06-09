import { notFound } from "next/navigation";
import { updateUserAction } from "@/app/actions/users";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/labels";
import type { UserRole } from "@/generated/prisma/client";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("user:write", "/usuarios");
  const { id } = await params;

  const user = await prisma.user.findFirst({ where: { id, archivedAt: null } });
  if (!user) notFound();

  const organizations = await prisma.organization.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, tradeName: true },
  });

  return (
    <div>
      <PageHeader title="Editar usuário" description={user.name} />
      <form action={updateUserAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="id" value={id} />
        <FormField label="Nome" name="name" defaultValue={user.name} required />
        <FormField label="E-mail" name="email" type="email" defaultValue={user.email} required />
        <FormField
          label="Nova senha"
          name="password"
          type="password"
          placeholder="Deixe em branco para manter"
        />
        <FormField
          label="Papel"
          name="role"
          as="select"
          defaultValue={user.role}
          options={(Object.keys(roleLabel) as UserRole[]).map((k) => ({
            value: k,
            label: roleLabel[k],
          }))}
        />
        <FormField
          label="Organização"
          name="organizationId"
          as="select"
          defaultValue={user.organizationId ?? ""}
          options={[
            { value: "", label: "Nenhuma" },
            ...organizations.map((o) => ({
              value: o.id,
              label: o.tradeName ?? o.name,
            })),
          ]}
        />
        <FormActions cancelHref={`/usuarios/${id}`} submitLabel="Salvar alterações" />
      </form>
    </div>
  );
}
