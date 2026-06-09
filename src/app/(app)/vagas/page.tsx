import Link from "next/link";
import { archiveJobAction } from "@/app/actions/jobs";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnPrimary, btnLink } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  employmentTypeLabel,
  formatDate,
  jobStatusLabel,
  taskPriorityLabel,
} from "@/lib/labels";

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canWrite = hasPermission(session.user.role, "job:write");

  const jobs = await prisma.jobOpening.findMany({
    where: { organizationId: session.activeOrganizationId, archivedAt: null },
    include: { _count: { select: { candidates: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { openedAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Gestão de vagas"
        description="Controle centralizado por cliente — migração do Notion."
      >
        {canWrite ? (
          <Link href="/vagas/nova" className={btnPrimary}>
            Nova vaga
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      {jobs.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga cadastrada"
          actionHref={canWrite ? "/vagas/nova" : undefined}
          actionLabel={canWrite ? "Nova vaga" : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3">Vaga</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Vínculo</th>
                  <th className="px-5 py-3">Prioridade</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Candidatos</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Aberta em</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--background)]/80">
                    <td className="px-5 py-4">
                      <Link href={`/vagas/${job.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                        {job.title}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">{job.seniority ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">{job.area ?? "—"}</td>
                    <td className="px-5 py-4">
                      <Badge tone="info">{employmentTypeLabel[job.employmentType]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          job.priority === "HIGH"
                            ? "danger"
                            : job.priority === "MEDIUM"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {taskPriorityLabel[job.priority]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          job.status === "OPEN"
                            ? "success"
                            : job.status === "PAUSED"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {jobStatusLabel[job.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-center font-medium">
                      <Link href={`/vagas/${job.id}/candidatos`} className={btnLink}>
                        {job._count.candidates}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">{job.ownerName ?? "—"}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{formatDate(job.openedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {canWrite ? (
                          <Link href={`/vagas/${job.id}/editar`} className={btnLink}>
                            Editar
                          </Link>
                        ) : null}
                        {hasPermission(session.user.role, "job:archive") ? (
                          <ConfirmForm
                            action={archiveJobAction}
                            id={job.id}
                            confirmMessage="Arquivar esta vaga?"
                            label="Arquivar"
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
