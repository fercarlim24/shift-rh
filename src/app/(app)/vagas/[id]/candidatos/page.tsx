import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary, btnLink } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function VagaCandidatosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const canWrite = hasPermission(session.user.role, "candidate:write");

  const job = await prisma.jobOpening.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
  });
  if (!job) notFound();

  const candidates = await prisma.candidate.findMany({
    where: { jobOpeningId: id, organizationId: session.activeOrganizationId, archivedAt: null },
    include: { stage: true, owner: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={`Candidatos — ${job.title}`} description="Pipeline vinculado à vaga">
        {canWrite ? (
          <Link
            href={`/candidatos/novo?jobOpeningId=${id}&returnTo=/vagas/${id}/candidatos`}
            className={btnPrimary}
          >
            Novo candidato
          </Link>
        ) : null}
      </PageHeader>

      {candidates.length === 0 ? (
        <EmptyState
          title="Nenhum candidato nesta vaga"
          actionHref={
            canWrite
              ? `/candidatos/novo?jobOpeningId=${id}&returnTo=/vagas/${id}/candidatos`
              : undefined
          }
          actionLabel={canWrite ? "Adicionar candidato" : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Etapa</th>
                <th className="px-5 py-3">Origem</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-4">
                    <Link href={`/candidatos/${c.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={c.stage.terminalType === "DECLINED" ? "danger" : "neutral"}>
                      {c.stage.name}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{c.source ?? "—"}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{c.owner?.name ?? "—"}</td>
                  <td className="px-5 py-4">
                    {canWrite ? (
                      <Link href={`/candidatos/${c.id}/editar`} className={btnLink}>
                        Editar
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-4 flex gap-4">
        <Link href={`/vagas/${id}`} className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para vaga
        </Link>
        <Link href="/recrutamento" className="text-sm text-[var(--muted)] hover:underline">
          Ver kanban
        </Link>
      </div>
    </div>
  );
}
