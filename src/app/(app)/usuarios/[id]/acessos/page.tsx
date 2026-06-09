import Link from "next/link";
import { notFound } from "next/navigation";
import {
  grantOrganizationAccessAction,
  revokeOrganizationAccessAction,
} from "@/app/actions/users";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/labels";

export default async function UsuarioAcessosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requirePagePermission("user:access", "/usuarios");
  const { id } = await params;
  const sp = await searchParams;

  const user = await prisma.user.findFirst({
    where: { id, archivedAt: null, role: "SHIFT_CONSULTANT" },
    include: {
      organizationAccess: { include: { organization: true } },
    },
  });
  if (!user) notFound();

  const organizations = await prisma.organization.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });

  const linkedIds = new Set(user.organizationAccess.map((a) => a.organizationId));
  const available = organizations.filter((o) => !linkedIds.has(o.id));

  return (
    <div>
      <PageHeader
        title={`Acessos — ${user.name}`}
        description="Vincular consultor a clientes específicos."
      />

      <FlashMessage success={sp.success} error={sp.error} />

      <Card className="mb-6 p-5">
        <p className="text-sm text-[var(--muted)]">
          Papel: <Badge tone="info">{roleLabel[user.role]}</Badge>
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Com vínculos explícitos, o consultor só acessa os clientes listados abaixo.
        </p>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--background)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Desde</th>
              <th className="px-5 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {user.organizationAccess.map((access) => (
              <tr key={access.id}>
                <td className="px-5 py-4">
                  {access.organization.tradeName ?? access.organization.name}
                </td>
                <td className="px-5 py-4 text-[var(--muted)]">
                  {new Intl.DateTimeFormat("pt-BR").format(access.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <ConfirmForm
                    action={revokeOrganizationAccessAction}
                    id={access.id}
                    confirmMessage="Remover acesso deste cliente?"
                    label="Remover"
                    hiddenFields={{ accessId: access.id, userId: id }}
                  />
                </td>
              </tr>
            ))}
            {user.organizationAccess.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-[var(--muted)]">
                  Nenhum vínculo — acesso a todos os clientes (fallback demo).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      {available.length > 0 ? (
        <form
          action={grantOrganizationAccessAction}
          className="max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-white p-6"
        >
          <input type="hidden" name="userId" value={id} />
          <FormField
            label="Conceder acesso ao cliente"
            name="organizationId"
            as="select"
            required
            options={available.map((o) => ({
              value: o.id,
              label: o.tradeName ?? o.name,
            }))}
          />
          <FormActions cancelHref={`/usuarios/${id}`} submitLabel="Conceder acesso" />
        </form>
      ) : null}

      <div className="mt-4">
        <Link href={`/usuarios/${id}`} className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para usuário
        </Link>
      </div>
    </div>
  );
}
