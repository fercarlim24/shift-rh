import Link from "next/link";
import { notFound } from "next/navigation";
import { closeJobAction } from "@/app/actions/jobs";
import { Badge, PageHeader, StatCard } from "@/components/app-shell";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { getJobSummary } from "@/lib/job-summary";
import { hasPermission } from "@/lib/permissions";
import {
  employmentTypeLabel,
  formatDate,
  jobStatusLabel,
  taskPriorityLabel,
} from "@/lib/labels";
import { requireSession } from "@/lib/session";

export default async function VagaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();

  const summary = await getJobSummary(id, session.activeOrganizationId);
  if (!summary) notFound();

  const { job, total, declined, hired, advanced, byStage } = summary;
  const canWrite = hasPermission(session.user.role, "job:write");

  return (
    <div>
      <PageHeader title={job.title} description={job.area ?? "Sem área definida"}>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <>
              <Link href={`/vagas/${id}/editar`} className={btnSecondary}>
                Editar
              </Link>
              {job.status !== "CLOSED" ? (
                <form action={closeJobAction}>
                  <input type="hidden" name="id" value={id} />
                  <button type="submit" className={btnSecondary}>
                    Fechar vaga
                  </button>
                </form>
              ) : null}
            </>
          ) : null}
          <Link href={`/vagas/${id}/candidatos`} className={btnSecondary}>
            Ver candidatos
          </Link>
        </div>
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total candidatos" value={total} />
        <StatCard label="Em pipeline" value={total - declined - hired} />
        <StatCard label="Declinados" value={declined} />
        <StatCard label="Contratados" value={hired} />
        <StatCard label="Avançaram etapa" value={advanced} hint="Passaram da triagem" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Dados da vaga">
          <DetailGrid>
            <DetailItem label="Status" value={<Badge>{jobStatusLabel[job.status]}</Badge>} />
            <DetailItem label="Vínculo" value={employmentTypeLabel[job.employmentType]} />
            <DetailItem label="Prioridade" value={taskPriorityLabel[job.priority]} />
            <DetailItem label="Senioridade" value={job.seniority ?? "—"} />
            <DetailItem label="Quantidade" value={job.quantity} />
            <DetailItem label="Responsável" value={job.ownerName ?? "—"} />
            <DetailItem label="Aberta em" value={formatDate(job.openedAt)} />
          </DetailGrid>
        </DetailCard>

        <DetailCard title="Candidatos por etapa">
          <div className="space-y-2">
            {byStage.map(({ stage, count }) => (
              <div key={stage.id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">{stage.name}</span>
                <Badge tone="neutral">{count}</Badge>
              </div>
            ))}
          </div>
        </DetailCard>
      </div>

      <div className="mt-4">
        <Link href="/vagas" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para vagas
        </Link>
      </div>
    </div>
  );
}
