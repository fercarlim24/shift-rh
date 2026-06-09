import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/app-shell";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/labels";

export default async function CandidatoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();

  const candidate = await prisma.candidate.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
    include: { stage: true, jobOpening: true, owner: true },
  });
  if (!candidate) notFound();

  const canWrite = hasPermission(session.user.role, "candidate:write");

  return (
    <div>
      <PageHeader title={candidate.name} description={candidate.email ?? "Sem e-mail"}>
        {canWrite ? (
          <Link href={`/candidatos/${id}/editar`} className={btnSecondary}>
            Editar
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <DetailCard>
        <DetailGrid>
          <DetailItem
            label="Etapa"
            value={
              <Badge tone={candidate.stage.terminalType === "DECLINED" ? "danger" : "info"}>
                {candidate.stage.name}
              </Badge>
            }
          />
          <DetailItem
            label="Vaga"
            value={
              candidate.jobOpening ? (
                <Link href={`/vagas/${candidate.jobOpening.id}`} className="text-[var(--accent)] hover:underline">
                  {candidate.jobOpening.title}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailItem label="Telefone" value={candidate.phone ?? "—"} />
          <DetailItem label="Origem" value={candidate.source ?? "—"} />
          <DetailItem label="Responsável" value={candidate.owner?.name ?? "—"} />
          <DetailItem label="Criado em" value={formatDate(candidate.createdAt)} />
          {candidate.declineReason ? (
            <DetailItem label="Motivo declínio" value={candidate.declineReason} />
          ) : null}
          {candidate.notes ? (
            <DetailItem label="Observações" value={candidate.notes} />
          ) : null}
        </DetailGrid>
      </DetailCard>

      <div className="mt-4 flex gap-4">
        <Link href="/candidatos" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para candidatos
        </Link>
        <Link href="/recrutamento" className="text-sm text-[var(--muted)] hover:underline">
          Ver no kanban
        </Link>
      </div>
    </div>
  );
}
