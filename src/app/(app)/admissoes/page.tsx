import Link from "next/link";
import {
  advanceOnboardingAction,
  sendToAutentiqueAction,
} from "@/app/actions/onboardings";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnLink, btnPrimary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  employmentTypeLabel,
  formatDate,
  onboardingStatusLabel,
  signatureStatusLabel,
} from "@/lib/labels";

export default async function AdmissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canWrite = hasPermission(session.user.role, "onboarding:write");

  const onboardings = await prisma.onboarding.findMany({
    where: { organizationId: session.activeOrganizationId, archivedAt: null },
    include: {
      candidate: { include: { jobOpening: true } },
      responsible: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Admissões"
        description="Onboarding com assinatura digital — integração Autentique simulada no protótipo."
      >
        {canWrite ? (
          <Link href="/admissoes/nova" className={btnPrimary}>
            Nova admissão
          </Link>
        ) : null}
      </PageHeader>

      <FlashMessage success={params.success} error={params.error} />

      {onboardings.length === 0 ? (
        <EmptyState
          title="Nenhuma admissão em andamento"
          actionHref={canWrite ? "/admissoes/nova" : undefined}
          actionLabel={canWrite ? "Nova admissão" : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {onboardings.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admissoes/${item.id}`}
                      className="text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
                    >
                      {item.employeeName}
                    </Link>
                    <Badge tone="info">{employmentTypeLabel[item.employmentType]}</Badge>
                  </div>
                  {item.candidate?.jobOpening ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Vaga: {item.candidate.jobOpening.title}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Responsável: {item.responsible?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Iniciado em {formatDate(item.createdAt)}
                  </p>
                  <Link href={`/admissoes/${item.id}`} className={`mt-2 inline-block ${btnLink}`}>
                    Ver detalhe e histórico
                  </Link>
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

              {canWrite && item.status !== "COMPLETED" ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  {item.status === "DOCS_PENDING" || item.status === "STARTED" ? (
                    <form action={sendToAutentiqueAction}>
                      <input type="hidden" name="onboardingId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/admissoes" />
                      <button
                        type="submit"
                        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
                      >
                        Enviar p/ Autentique (mock)
                      </button>
                    </form>
                  ) : null}
                  <form action={advanceOnboardingAction}>
                    <input type="hidden" name="onboardingId" value={item.id} />
                    <input type="hidden" name="returnTo" value="/admissoes" />
                    <button
                      type="submit"
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
                    >
                      Avançar etapa
                    </button>
                  </form>
                  <Link href={`/admissoes/${item.id}/editar`} className={btnLink}>
                    Editar
                  </Link>
                </div>
              ) : item.status === "COMPLETED" ? (
                <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-emerald-700">
                  Admissão concluída com documento assinado.
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
