import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/app-shell";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, roleLabel } from "@/lib/labels";

export default async function UsuarioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requirePagePermission("user:read", "/dashboard");
  const { id } = await params;
  const sp = await searchParams;

  const user = await prisma.user.findFirst({
    where: { id, archivedAt: null },
    include: {
      organization: true,
      organizationAccess: { include: { organization: true } },
    },
  });
  if (!user) notFound();

  return (
    <div>
      <PageHeader title={user.name} description={user.email}>
        <div className="flex gap-2">
          <Link href={`/usuarios/${id}/editar`} className={btnSecondary}>
            Editar
          </Link>
          {user.role === "SHIFT_CONSULTANT" ? (
            <Link href={`/usuarios/${id}/acessos`} className={btnSecondary}>
              Gerenciar acessos
            </Link>
          ) : null}
        </div>
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <DetailCard>
        <DetailGrid>
          <DetailItem label="Papel" value={<Badge tone="info">{roleLabel[user.role]}</Badge>} />
          <DetailItem
            label="Organização"
            value={user.organization?.tradeName ?? user.organization?.name ?? "—"}
          />
          <DetailItem label="Criado em" value={formatDate(user.createdAt)} />
        </DetailGrid>
      </DetailCard>

      {user.role === "SHIFT_CONSULTANT" ? (
        <div className="mt-4">
        <DetailCard title="Clientes com acesso">
          {user.organizationAccess.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Sem vínculos explícitos — consultor enxerga todos os clientes ativos (modo demo).
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {user.organizationAccess.map((a) => (
                <li key={a.id}>
                  {a.organization.tradeName ?? a.organization.name}
                </li>
              ))}
            </ul>
          )}
        </DetailCard>
        </div>
      ) : null}

      <div className="mt-4">
        <Link href="/usuarios" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para usuários
        </Link>
      </div>
    </div>
  );
}
