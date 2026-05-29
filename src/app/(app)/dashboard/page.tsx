import Link from "next/link";
import { Badge, Card, PageHeader, StatCard } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDate, jobStatusLabel, taskStatusLabel } from "@/lib/labels";

export default async function DashboardPage() {
  const session = await requireSession();
  const orgId = session.activeOrganizationId;

  const [org, openJobs, inPipeline, hiredCount, candidates, tasks, onboardings] =
    await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.jobOpening.count({ where: { organizationId: orgId, status: "OPEN" } }),
    prisma.candidate.count({
      where: { organizationId: orgId, stage: { isTerminal: false } },
    }),
    prisma.candidate.count({
      where: { organizationId: orgId, stage: { terminalType: "HIRED" } },
    }),
    prisma.candidate.findMany({
      where: { organizationId: orgId },
      include: { stage: true, jobOpening: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { organizationId: orgId, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.onboarding.count({
      where: { organizationId: orgId, status: { not: "COMPLETED" } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão operacional — ${org?.tradeName ?? org?.name}`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vagas abertas" value={openJobs} hint="Substitui Notion" />
        <StatCard label="Candidatos no funil" value={inPipeline} hint="Pipeline R&S" />
        <StatCard label="Contratações recentes" value={hiredCount} hint="Etapa contratado" />
        <StatCard label="Admissões em andamento" value={onboardings} hint="Fluxo Autentique (mock)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Candidatos recentes</h3>
            <Link href="/recrutamento" className="text-sm text-teal-700 hover:underline">
              Ver pipeline
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{candidate.name}</p>
                  <p className="text-xs text-slate-500">
                    {candidate.jobOpening?.title ?? "Sem vaga"} · {candidate.stage.name}
                  </p>
                </div>
                <Badge tone="info">{candidate.stage.name}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Tarefas pendentes</h3>
            <Link href="/tarefas" className="text-sm text-teal-700 hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li key={task.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">
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
              <li className="py-6 text-center text-sm text-slate-500">Nenhuma tarefa pendente.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-3 font-semibold text-slate-900">Módulos do MVP neste protótipo</h3>
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
        <p className="mt-3 text-sm text-slate-600">
          Vagas abertas no tenant: <strong>{openJobs}</strong> · Status possíveis:{" "}
          {Object.values(jobStatusLabel).join(", ")}
        </p>
      </Card>
    </div>
  );
}
