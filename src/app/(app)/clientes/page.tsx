import { Badge, Card, PageHeader } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/labels";

export default async function ClientesPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          jobOpenings: true,
          candidates: true,
          tasks: true,
          employees: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Ambientes multi-tenant — cada cliente com dados isolados."
      />

      <div className="grid gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {org.tradeName ?? org.name}
                  </h3>
                  <Badge tone={org.status === "ACTIVE" ? "success" : "neutral"}>
                    {org.status === "ACTIVE" ? "Ativo" : org.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{org.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {org.city}, {org.region} · CNPJ {org.cnpj ?? "—"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Cliente desde {formatDate(org.createdAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Vagas" value={org._count.jobOpenings} />
                <Metric label="Candidatos" value={org._count.candidates} />
                <Metric label="Tarefas" value={org._count.tasks} />
                <Metric label="Colaboradores" value={org._count.employees} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
