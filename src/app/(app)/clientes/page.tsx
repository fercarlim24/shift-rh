import Link from "next/link";
import { archiveOrganizationAction } from "@/app/actions/organizations";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnPrimary } from "@/components/ui/form-fields";
import {
  canCreateOrganization,
  canViewAllOrganizations,
  hasPermission,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/labels";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canCreate = canCreateOrganization(session.user.role);
  const canWrite = hasPermission(session.user.role, "org:write");

  const orgFilter = canViewAllOrganizations(session.user.role)
    ? { archivedAt: null }
    : session.user.organizationId
      ? { id: session.user.organizationId, archivedAt: null }
      : { id: "__none__" };

  const organizations = await prisma.organization.findMany({
    where: orgFilter,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          jobOpenings: true,
          candidates: true,
          tasks: true,
          employees: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Ambientes multi-tenant — cada cliente com dados isolados."
      >
        {canCreate ? (
          <Link href="/clientes/novo" className={btnPrimary}>
            Novo cliente
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      {organizations.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Crie o primeiro ambiente multi-tenant."
          actionHref={canCreate ? "/clientes/novo" : undefined}
          actionLabel={canCreate ? "Novo cliente" : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/clientes/${org.id}`}
                      className="text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
                    >
                      {org.tradeName ?? org.name}
                    </Link>
                    <Badge tone={org.status === "ACTIVE" ? "success" : "neutral"}>
                      {org.status === "ACTIVE" ? "Ativo" : org.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{org.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {org.city}, {org.region} · CNPJ {org.cnpj ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Cliente desde {formatDate(org.createdAt)}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link href={`/clientes/${org.id}`} className="text-sm text-[var(--accent)] hover:underline">
                      Ver detalhe
                    </Link>
                    {canWrite ? (
                      <Link
                        href={`/clientes/${org.id}/editar`}
                        className="text-sm text-[var(--muted)] hover:underline"
                      >
                        Editar
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="Vagas" value={org._count.jobOpenings} />
                    <Metric label="Candidatos" value={org._count.candidates} />
                    <Metric label="Tarefas" value={org._count.tasks} />
                    <Metric label="Colaboradores" value={org._count.employees} />
                  </div>
                  {hasPermission(session.user.role, "org:archive") ? (
                    <ConfirmForm
                      action={archiveOrganizationAction}
                      id={org.id}
                      confirmMessage="Arquivar este cliente? Os dados serão preservados."
                      label="Arquivar"
                    />
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--background)] px-4 py-3 text-center">
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}
