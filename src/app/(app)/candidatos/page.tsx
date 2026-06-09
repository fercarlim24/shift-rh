import Link from "next/link";
import { archiveCandidateAction } from "@/app/actions/candidates";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnPrimary, btnLink } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/labels";

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canWrite = hasPermission(session.user.role, "candidate:write");

  const candidates = await prisma.candidate.findMany({
    where: { organizationId: session.activeOrganizationId, archivedAt: null },
    include: { stage: true, jobOpening: true, owner: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Candidatos" description="Todos os candidatos do cliente ativo.">
        {canWrite ? (
          <Link href="/candidatos/novo" className={btnPrimary}>
            Novo candidato
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      {candidates.length === 0 ? (
        <EmptyState
          title="Nenhum candidato cadastrado"
          actionHref={canWrite ? "/candidatos/novo" : undefined}
          actionLabel={canWrite ? "Novo candidato" : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Vaga</th>
                <th className="px-5 py-3">Etapa</th>
                <th className="px-5 py-3">Origem</th>
                <th className="px-5 py-3">Atualizado</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--background)]/80">
                  <td className="px-5 py-4">
                    <Link href={`/candidatos/${c.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">{c.email ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">
                    {c.jobOpening ? (
                      <Link href={`/vagas/${c.jobOpening.id}`} className="hover:underline">
                        {c.jobOpening.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={c.stage.terminalType === "DECLINED" ? "danger" : "info"}>
                      {c.stage.name}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{c.source ?? "—"}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{formatDate(c.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canWrite ? (
                        <Link href={`/candidatos/${c.id}/editar`} className={btnLink}>
                          Editar
                        </Link>
                      ) : null}
                      {hasPermission(session.user.role, "candidate:archive") ? (
                        <ConfirmForm
                          action={archiveCandidateAction}
                          id={c.id}
                          confirmMessage="Arquivar este candidato?"
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
