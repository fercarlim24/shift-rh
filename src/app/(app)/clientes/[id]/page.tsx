import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader, StatCard } from "@/components/app-shell";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/tenant";
import { formatDate } from "@/lib/labels";

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireOrganizationAccess(id);

  const org = await prisma.organization.findFirst({
    where: { id, archivedAt: null },
    include: {
      _count: {
        select: {
          jobOpenings: true,
          candidates: true,
          tasks: true,
          employees: true,
          onboardings: true,
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <div>
      <PageHeader title={org.tradeName ?? org.name} description={org.name}>
        {hasPermission(session.user.role, "org:write") ? (
          <Link href={`/clientes/${id}/editar`} className={btnSecondary}>
            Editar
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Vagas" value={org._count.jobOpenings} />
        <StatCard label="Candidatos" value={org._count.candidates} />
        <StatCard label="Tarefas" value={org._count.tasks} />
        <StatCard label="Colaboradores" value={org._count.employees} />
        <StatCard label="Admissões" value={org._count.onboardings} />
      </div>

      <DetailCard title="Dados do cliente">
        <DetailGrid>
          <DetailItem label="Status" value={<Badge tone="success">{org.status}</Badge>} />
          <DetailItem label="CNPJ" value={org.cnpj ?? "—"} />
          <DetailItem label="Cidade" value={`${org.city ?? "—"}, ${org.region ?? "—"}`} />
          <DetailItem label="Cliente desde" value={formatDate(org.createdAt)} />
          <DetailItem label="Atualizado em" value={formatDate(org.updatedAt)} />
        </DetailGrid>
      </DetailCard>

      <div className="mt-4">
        <Link href="/clientes" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para clientes
        </Link>
      </div>
    </div>
  );
}
