import {
  advanceOnboardingAction,
  sendToAutentiqueAction,
} from "@/app/actions";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  employmentTypeLabel,
  formatDate,
  onboardingStatusLabel,
  signatureStatusLabel,
} from "@/lib/labels";

export default async function AdmissoesPage() {
  const session = await requireSession();

  const onboardings = await prisma.onboarding.findMany({
    where: { organizationId: session.activeOrganizationId },
    include: { candidate: { include: { jobOpening: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Admissões"
        description="Onboarding com assinatura digital — integração Autentique simulada no protótipo."
      />

      <div className="grid gap-4">
        {onboardings.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{item.employeeName}</h3>
                  <Badge tone="info">{employmentTypeLabel[item.employmentType]}</Badge>
                </div>
                {item.candidate?.jobOpening ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Vaga: {item.candidate.jobOpening.title}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Iniciado em {formatDate(item.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  tone={
                    item.status === "COMPLETED"
                      ? "success"
                      : item.status === "SIGNATURE"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {onboardingStatusLabel[item.status]}
                </Badge>
                <Badge
                  tone={
                    item.signatureStatus === "SIGNED"
                      ? "success"
                      : item.signatureStatus === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                >
                  Autentique: {signatureStatusLabel[item.signatureStatus]}
                </Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {item.status !== "COMPLETED" ? (
                <>
                  {item.status === "DOCS_PENDING" || item.status === "STARTED" ? (
                    <form action={sendToAutentiqueAction}>
                      <input type="hidden" name="onboardingId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800"
                      >
                        Enviar p/ Autentique (mock)
                      </button>
                    </form>
                  ) : null}
                  <form action={advanceOnboardingAction}>
                    <input type="hidden" name="onboardingId" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Avançar etapa
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-emerald-700">Admissão concluída com documento assinado.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
