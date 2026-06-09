import Link from "next/link";
import { archiveEmployeeAction } from "@/app/actions/employees";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnLink, btnPrimary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { employmentTypeLabel, formatDate } from "@/lib/labels";

export default async function ColaboradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canWrite = hasPermission(session.user.role, "employee:write");

  const where: Record<string, unknown> = {
    organizationId: session.activeOrganizationId,
    archivedAt: null,
  };

  if (session.user.role === "COLLABORATOR") {
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id },
    });
    if (employee) where.id = employee.id;
    else where.id = "none";
  }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Colaboradores" description="Equipe ativa do cliente — CLT e PJ.">
        {canWrite ? (
          <Link href="/colaboradores/novo" className={btnPrimary}>
            Novo colaborador
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      {employees.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador cadastrado"
          actionHref={canWrite ? "/colaboradores/novo" : undefined}
          actionLabel={canWrite ? "Novo colaborador" : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Vínculo</th>
                <th className="px-5 py-3">Cargo</th>
                <th className="px-5 py-3">Área</th>
                <th className="px-5 py-3">Início</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[var(--background)]/80">
                  <td className="px-5 py-4">
                    <Link href={`/colaboradores/${emp.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {emp.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">{emp.email ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone="info">{employmentTypeLabel[emp.employmentType]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{emp.role ?? "—"}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{emp.area ?? "—"}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{formatDate(emp.startDate)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canWrite ? (
                        <Link href={`/colaboradores/${emp.id}/editar`} className={btnLink}>
                          Editar
                        </Link>
                      ) : null}
                      {hasPermission(session.user.role, "employee:archive") ? (
                        <ConfirmForm
                          action={archiveEmployeeAction}
                          id={emp.id}
                          confirmMessage="Arquivar este colaborador?"
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
      )}
    </div>
  );
}
