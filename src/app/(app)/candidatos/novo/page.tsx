import { createCandidateAction } from "@/app/actions/candidates";
import { PageHeader } from "@/components/app-shell";
import { FormActions, FormField } from "@/components/ui/form-fields";
import { getFormOptions } from "@/lib/form-data";
import { requirePagePermission } from "@/lib/page-guards";

export default async function NovoCandidatoPage({
  searchParams,
}: {
  searchParams: Promise<{ jobOpeningId?: string; returnTo?: string }>;
}) {
  const session = await requirePagePermission("candidate:write", "/candidatos");
  const params = await searchParams;
  const { users, jobs, stages } = await getFormOptions(session);

  const returnTo = params.returnTo ?? "/candidatos";

  return (
    <div>
      <PageHeader title="Novo candidato" description="Adicionar candidato ao pipeline." />
      <form action={createCandidateAction} className="max-w-xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <input type="hidden" name="returnTo" value={returnTo} />
        <FormField label="Nome" name="name" required />
        <FormField label="E-mail" name="email" type="email" />
        <FormField label="Telefone" name="phone" />
        <FormField label="Origem" name="source" placeholder="LinkedIn, indicação..." />
        <FormField
          label="Vaga"
          name="jobOpeningId"
          as="select"
          defaultValue={params.jobOpeningId ?? ""}
          options={[
            { value: "", label: "Sem vaga" },
            ...jobs.map((j) => ({ value: j.id, label: j.title })),
          ]}
        />
        <FormField
          label="Etapa inicial"
          name="stageId"
          as="select"
          defaultValue={stages[0]?.id ?? ""}
          options={stages.map((s) => ({ value: s.id, label: s.name }))}
        />
        <FormField
          label="Responsável"
          name="ownerId"
          as="select"
          defaultValue={session.user.id}
          options={[
            { value: "", label: "Sem responsável" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <FormField label="Observações" name="notes" as="textarea" />
        <FormActions cancelHref={returnTo} submitLabel="Criar candidato" />
      </form>
    </div>
  );
}
