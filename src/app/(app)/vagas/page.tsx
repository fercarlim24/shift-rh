import { Badge, Card, PageHeader } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  employmentTypeLabel,
  formatDate,
  jobStatusLabel,
  taskPriorityLabel,
} from "@/lib/labels";

export default async function VagasPage() {
  const session = await requireSession();

  const jobs = await prisma.jobOpening.findMany({
    where: { organizationId: session.activeOrganizationId },
    include: { _count: { select: { candidates: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { openedAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Gestão de vagas"
        description="Controle centralizado por cliente — migração do Notion."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Vaga</th>
                <th className="px-5 py-3">Área</th>
                <th className="px-5 py-3">Vínculo</th>
                <th className="px-5 py-3">Prioridade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Candidatos</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Aberta em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.seniority ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{job.area ?? "—"}</td>
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
                  <td className="px-5 py-4 text-center font-medium">{job._count.candidates}</td>
                  <td className="px-5 py-4 text-slate-600">{job.ownerName ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(job.openedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nenhuma vaga cadastrada.</p>
        ) : null}
      </Card>
    </div>
  );
}
