import {
  archivePipelineStageAction,
  createPipelineStageAction,
  reorderPipelineStageAction,
  updatePipelineStageAction,
} from "@/app/actions/pipeline";
import { Badge, Card, PageHeader } from "@/components/app-shell";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { requirePagePermission } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
export default async function PipelineConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requirePagePermission("pipeline:config", "/dashboard");
  const params = await searchParams;
  const orgId = session.activeOrganizationId;

  const stages = await prisma.pipelineStage.findMany({
    where: { organizationId: orgId, archivedAt: null },
    include: { _count: { select: { candidates: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Etapas do pipeline"
        description="Configuração de etapas R&S para o cliente ativo."
      />

      <FlashMessage success={params.success} error={params.error} />

      <Card className="mb-6 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--background)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3">Ordem</th>
              <th className="px-5 py-3">Etapa</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Candidatos</th>
              <th className="px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {stages.map((stage, index) => (
              <tr key={stage.id}>
                <td className="px-5 py-4">{stage.order + 1}</td>
                <td className="px-5 py-4">
                  <form action={updatePipelineStageAction} className="flex gap-2">
                    <input type="hidden" name="id" value={stage.id} />
                    <input
                      name="name"
                      defaultValue={stage.name}
                      className="rounded border border-[var(--border)] px-2 py-1 text-sm"
                    />
                    <button type="submit" className="text-xs text-[var(--accent)] hover:underline">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="px-5 py-4">
                  {stage.isTerminal ? (
                    <Badge tone="warning">{stage.terminalType ?? "Terminal"}</Badge>
                  ) : (
                    <Badge tone="neutral">Pipeline</Badge>
                  )}
                </td>
                <td className="px-5 py-4 text-center">{stage._count.candidates}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <form action={reorderPipelineStageAction}>
                      <input type="hidden" name="id" value={stage.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="text-xs text-[var(--muted)] hover:underline disabled:opacity-40"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={reorderPipelineStageAction}>
                      <input type="hidden" name="id" value={stage.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === stages.length - 1}
                        className="text-xs text-[var(--muted)] hover:underline disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </form>
                    {stage._count.candidates > 0 ? (
                      <form action={archivePipelineStageAction} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={stage.id} />
                        <select
                          name="targetStageId"
                          required
                          className="rounded border border-[var(--border)] px-1 py-0.5 text-xs"
                        >
                          <option value="">Mover para...</option>
                          {stages
                            .filter((s) => s.id !== stage.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                        <button type="submit" className="text-xs text-red-700 hover:underline">
                          Arquivar
                        </button>
                      </form>
                    ) : (
                      <ConfirmForm
                        action={archivePipelineStageAction}
                        id={stage.id}
                        confirmMessage="Arquivar esta etapa?"
                        label="Arquivar"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <form
        action={createPipelineStageAction}
        className="max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-white p-6"
      >
        <h3 className="font-semibold text-[var(--foreground)]">Nova etapa</h3>
        <FormField label="Nome" name="name" required />
        <FormField
          label="Posição (1 = primeira)"
          name="order"
          type="number"
          defaultValue={stages.length + 1}
          required
        />
        <FormField
          label="Etapa terminal?"
          name="isTerminal"
          as="select"
          defaultValue="false"
          options={[
            { value: "false", label: "Não" },
            { value: "true", label: "Sim" },
          ]}
        />
        <FormField
          label="Tipo terminal"
          name="terminalType"
          as="select"
          defaultValue=""
          options={[
            { value: "", label: "—" },
            { value: "HIRED", label: "Contratado" },
            { value: "DECLINED", label: "Declinado" },
          ]}
        />
        <FormActions cancelHref="/recrutamento" submitLabel="Criar etapa" />
      </form>
    </div>
  );
}
