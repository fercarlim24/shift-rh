import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveEmployeeAction } from "@/app/actions/employees";
import { Badge, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { employmentTypeLabel, formatDate } from "@/lib/labels";

export default async function ColaboradorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();

  const where: Record<string, unknown> = {
    id,
    organizationId: session.activeOrganizationId,
    archivedAt: null,
  };

  if (session.user.role === "COLLABORATOR") {
    where.userId = session.user.id;
  }

  const employee = await prisma.employee.findFirst({ where });
  if (!employee) notFound();

  const canWrite = hasPermission(session.user.role, "employee:write");

  return (
    <div>
      <PageHeader title={employee.name} description={employee.role ?? "Colaborador"}>
        {canWrite ? (
          <Link href={`/colaboradores/${id}/editar`} className={btnSecondary}>
            Editar
          </Link>
        ) : null}
        {hasPermission(session.user.role, "employee:archive") ? (
          <ConfirmForm
            action={archiveEmployeeAction}
            id={id}
            confirmMessage="Arquivar este colaborador?"
            label="Arquivar"
          />
        ) : null}
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <DetailCard>
        <DetailGrid>
          <DetailItem label="Vínculo" value={<Badge tone="info">{employmentTypeLabel[employee.employmentType]}</Badge>} />
          <DetailItem label="E-mail" value={employee.email ?? "—"} />
          <DetailItem label="Documento" value={employee.document ?? "—"} />
          <DetailItem label="Área" value={employee.area ?? "—"} />
          <DetailItem label="Status" value={employee.status} />
          <DetailItem label="Início" value={formatDate(employee.startDate)} />
          {employee.employmentType === "PJ" ? (
            <>
              <DetailItem label="Empresa PJ" value={employee.pjCompanyName ?? "—"} />
              <DetailItem label="CNPJ PJ" value={employee.pjCnpj ?? "—"} />
            </>
          ) : null}
        </DetailGrid>
      </DetailCard>

      <div className="mt-4">
        <Link href="/colaboradores" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para colaboradores
        </Link>
      </div>
    </div>
  );
}
