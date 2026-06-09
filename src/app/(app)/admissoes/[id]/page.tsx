import Link from "next/link";
import { notFound } from "next/navigation";
import {
  advanceOnboardingAction,
  archiveOnboardingAction,
  sendToAutentiqueAction,
  uploadOnboardingDocumentAction,
} from "@/app/actions/onboardings";
import { Badge, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { DetailCard, DetailGrid, DetailItem } from "@/components/ui/detail-section";
import { FlashMessage } from "@/components/ui/flash-message";
import { btnSecondary } from "@/components/ui/form-fields";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  employmentTypeLabel,
  formatDate,
  onboardingStatusLabel,
  signatureStatusLabel,
} from "@/lib/labels";

export default async function AdmissaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();
  const returnTo = `/admissoes/${id}`;

  const onboarding = await prisma.onboarding.findFirst({
    where: { id, organizationId: session.activeOrganizationId, archivedAt: null },
    include: {
      candidate: { include: { jobOpening: true } },
      responsible: true,
      events: { orderBy: { createdAt: "desc" } },
      attachedDocuments: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });
  if (!onboarding) notFound();

  const canWrite = hasPermission(session.user.role, "onboarding:write");
  const legacyDocs = onboarding.documents as {
    autentique?: { id: string; name: string };
  } | null;

  return (
    <div>
      <PageHeader title={onboarding.employeeName} description="Processo de admissão">
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Link href={`/admissoes/${id}/editar`} className={btnSecondary}>
              Editar
            </Link>
          ) : null}
          {hasPermission(session.user.role, "onboarding:archive") ? (
            <ConfirmForm
              action={archiveOnboardingAction}
              id={id}
              confirmMessage="Arquivar esta admissão?"
              label="Arquivar"
            />
          ) : null}
        </div>
      </PageHeader>

      <FlashMessage success={sp.success} error={sp.error} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Status do processo">
          <DetailGrid>
            <DetailItem
              label="Etapa"
              value={<Badge>{onboardingStatusLabel[onboarding.status]}</Badge>}
            />
            <DetailItem label="Vínculo" value={employmentTypeLabel[onboarding.employmentType]} />
            <DetailItem
              label="Assinatura"
              value={signatureStatusLabel[onboarding.signatureStatus]}
            />
            <DetailItem label="Responsável" value={onboarding.responsible?.name ?? "—"} />
            <DetailItem label="Iniciado em" value={formatDate(onboarding.createdAt)} />
          </DetailGrid>

          {canWrite && onboarding.status !== "COMPLETED" ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              {(onboarding.status === "STARTED" || onboarding.status === "DOCS_PENDING") ? (
                <form action={sendToAutentiqueAction}>
                  <input type="hidden" name="onboardingId" value={id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)]">
                    Enviar p/ Autentique (mock)
                  </button>
                </form>
              ) : null}
              <form action={advanceOnboardingAction}>
                <input type="hidden" name="onboardingId" value={id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button type="submit" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background)]">
                  Avançar etapa
                </button>
              </form>
            </div>
          ) : null}
        </DetailCard>

        <DetailCard title="Documentos anexados">
          {canWrite ? (
            <form action={uploadOnboardingDocumentAction} className="mb-4 space-y-2 border-b border-[var(--border)] pb-4">
              <input type="hidden" name="onboardingId" value={id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Anexar documento (máx. 2 MB)
              </label>
              <input
                type="file"
                name="file"
                required
                className="block w-full text-sm text-[var(--muted)]"
              />
              <button type="submit" className="rounded-[var(--radius)] bg-zinc-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-900 active:scale-[0.98]">
                Enviar arquivo
              </button>
            </form>
          ) : null}

          {onboarding.attachedDocuments.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nenhum documento anexado.</p>
          ) : (
            <ul className="space-y-2 text-sm text-[var(--foreground)]">
              {onboarding.attachedDocuments.map((doc) => (
                <li key={doc.id} className="rounded-lg bg-[var(--background)] px-3 py-2">
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {(doc.size / 1024).toFixed(1)} KB · {doc.mimeType} ·{" "}
                    {doc.uploadedBy?.name ?? "—"} · {formatDate(doc.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {legacyDocs?.autentique ? (
            <p className="mt-3 text-xs text-[var(--accent)]">
              Autentique mock: {legacyDocs.autentique.name} ({legacyDocs.autentique.id})
            </p>
          ) : null}
        </DetailCard>
      </div>

      <div className="mt-4">
      <DetailCard title="Histórico de eventos">
        {onboarding.events.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum evento registrado.</p>
        ) : (
          <ul className="space-y-3">
            {onboarding.events.map((ev) => (
              <li key={ev.id} className="border-l-2 border-[var(--accent)]/40 pl-4 text-sm">
                <p className="font-medium text-[var(--foreground)]">{ev.message}</p>
                <p className="text-xs text-[var(--muted)]">
                  {ev.type} · {formatDate(ev.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
      </div>

      <div className="mt-4">
        <Link href="/admissoes" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar para admissões
        </Link>
      </div>
    </div>
  );
}
