import Link from "next/link";
import { archiveUserAction } from "@/app/actions/users";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnLink, btnPrimary } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/labels";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requirePagePermission("user:read", "/dashboard");
  const params = await searchParams;

  const users = await prisma.user.findMany({
    where: { archivedAt: null },
    include: {
      organization: { select: { tradeName: true, name: true } },
      _count: { select: { organizationAccess: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Usuários" description="Gestão de contas e papéis — Admin Shift.">
        <Link href="/usuarios/novo" className={btnPrimary}>
          Novo usuário
        </Link>
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      <Card className="overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">E-mail</th>
              <th className="px-5 py-3">Papel</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Acessos</th>
              <th className="px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4">
                  <Link href={`/usuarios/${user.id}`} className="font-medium text-[var(--accent)] hover:underline">
                    {user.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-[var(--muted)]">{user.email}</td>
                <td className="px-5 py-4">
                  <Badge tone="info">{roleLabel[user.role]}</Badge>
                </td>
                <td className="px-5 py-4 text-[var(--muted)]">
                  {user.organization?.tradeName ?? user.organization?.name ?? "—"}
                </td>
                <td className="px-5 py-4 text-center">
                  {user.role === "SHIFT_CONSULTANT" ? user._count.organizationAccess : "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/usuarios/${user.id}/editar`} className={btnLink}>
                      Editar
                    </Link>
                    {user.role === "SHIFT_CONSULTANT" ? (
                      <Link href={`/usuarios/${user.id}/acessos`} className={btnLink}>
                        Acessos
                      </Link>
                    ) : null}
                    {user.id !== session.user.id ? (
                      <ConfirmForm
                        action={archiveUserAction}
                        id={user.id}
                        confirmMessage="Arquivar este usuário?"
                        label="Arquivar"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
