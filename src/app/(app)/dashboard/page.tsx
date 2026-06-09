import Link from "next/link";
import { Badge, Card, PageHeader, StatCard } from "@/components/app-shell";
import { FlashMessage } from "@/components/ui/flash-message";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate, jobStatusLabel, taskStatusLabel } from "@/lib/labels";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const orgId = session.activeOrganizationId;

  const taskWhere =
    session.user.role === "COLLABORATOR"
      ? { organizationId: orgId, assigneeId: session.user.id, status: { not: "DONE" as const }, archivedAt: null }
      : { organizationId: orgId, status: { not: "DONE" as const }, archivedAt: null };

  const [org, openJobs, inPipeline, hiredCount, candidates, tasks, onboardings] =
    await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.jobOpening.count({
        where: { organizationId: orgId, status: "OPEN", archivedAt: null },
      }),
      prisma.candidate.count({
        where: {
          organizationId: orgId,
          archivedAt: null,
          stage: { isTerminal: false },
        },
      }),
      prisma.candidate.count({
        where: {
          organizationId: orgId,
          archivedAt: null,
          stage: { terminalType: "HIRED" },
        },
      }),
      prisma.candidate.findMany({
        where: { organizationId: orgId, archivedAt: null },
        include: { stage: true, jobOpening: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: taskWhere,
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.onboarding.count({
        where: { organizationId: orgId, status: { not: "COMPLETED" }, archivedAt: null },
      }),
    ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão operacional — ${org?.tradeName ?? org?.name}`}
      />

      <FlashMessage error={params.error} />

      <div className="ui-stagger-grid mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vagas abertas" value={openJobs} hint="Substitui Notion" />
        <StatCard label="Candidatos no funil" value={inPipeline} hint="Pipeline R&S" />
        <StatCard label="Contratações recentes" value={hiredCount} hint="Etapa contratado" />
        <StatCard label="Admissões em andamento" value={onboardings} hint="Fluxo Autentique (mock)" />
      </div>

      <div className="ui-stagger-grid grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">Candidatos recentes</h3>
            <Link href="/recrutamento" className="text-sm font-medium text-[var(--accent)] hover:underline">
              Ver pipeline
            </Link>
          </div>
          <ul className="ui-stagger-list divide-y divide-[var(--border)]">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{candidate.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {candidate.jobOpening?.title ?? "Sem vaga"} · {candidate.stage.name}
                  </p>
                </div>
                <Badge tone="info">{candidate.stage.name}</Badge>
              </li>
            ))}
            {candidates.length === 0 ? (
              <li className="py-8 text-center text-sm text-[var(--muted)]">
                Nenhum candidato recente.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">Tarefas pendentes</h3>
            <Link href="/tarefas" className="text-sm font-medium text-[var(--accent)] hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="ui-stagger-list divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <li key={task.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{task.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Prazo: {formatDate(task.dueDate)} · {taskStatusLabel[task.status]}
                    </p>
                  </div>
                  <Badge
                    tone={
                      task.status === "IN_PROGRESS"
                        ? "warning"
                        : task.status === "DONE"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {taskStatusLabel[task.status]}
                  </Badge>
                </div>
              </li>
            ))}
            {tasks.length === 0 ? (
              <li className="py-6 text-center text-sm text-[var(--muted)]">Nenhuma tarefa pendente.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="ui-reveal-in mt-6 p-5">
        <h3 className="mb-3 font-semibold text-[var(--foreground)]">Módulos do MVP neste protótipo</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Multi-tenant",
            "Gestão de vagas",
            "Pipeline R&S",
            "Tarefas",
            "Admissão (mock Autentique)",
            "CLT + PJ",
          ].map((item) => (
            <Badge key={item} tone="success">
              {item}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Vagas abertas no tenant: <strong>{openJobs}</strong> · Status possíveis:{" "}
          {Object.values(jobStatusLabel).join(", ")}
        </p>
      </Card>
    </div>
  );
}
