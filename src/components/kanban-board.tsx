"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { moveCandidateAction } from "@/app/actions/candidates";
import { Badge } from "@/components/ui/badge";
import { btnLink, btnPrimary, inputClass } from "@/lib/ui-classes";

type Stage = {
  id: string;
  name: string;
  order: number;
  isTerminal: boolean;
  terminalType: string | null;
};

type Candidate = {
  id: string;
  name: string;
  email: string | null;
  source: string | null;
  declineReason: string | null;
  stageId: string;
  jobOpening: { id: string; title: string } | null;
  owner: { name: string } | null;
};

export function KanbanBoard({
  stages,
  candidates,
  jobs,
  canWrite = true,
}: {
  stages: Stage[];
  candidates: Candidate[];
  jobs: { id: string; title: string }[];
  canWrite?: boolean;
}) {
  const [jobFilter, setJobFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (jobFilter === "all") return candidates;
    return candidates.filter((c) => c.jobOpening?.id === jobFilter);
  }, [candidates, jobFilter]);

  const summary = useMemo(() => {
    const declined = filtered.filter((c) => {
      const stage = stages.find((s) => s.id === c.stageId);
      return stage?.terminalType === "DECLINED";
    }).length;
    const hired = filtered.filter((c) => {
      const stage = stages.find((s) => s.id === c.stageId);
      return stage?.terminalType === "HIRED";
    }).length;
    const advanced = filtered.filter((c) => {
      const stage = stages.find((s) => s.id === c.stageId);
      return stage && stage.order >= 1;
    }).length;
    return { total: filtered.length, declined, hired, advanced };
  }, [filtered, stages]);

  const newCandidateHref =
    jobFilter !== "all"
      ? `/candidatos/novo?jobOpeningId=${jobFilter}&returnTo=/recrutamento`
      : "/candidatos/novo?returnTo=/recrutamento";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="jobFilter" className="text-sm font-medium text-[var(--foreground)]">
          Filtrar por vaga
        </label>
        <select
          id="jobFilter"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className={`${inputClass} w-auto min-w-[200px] py-2`}
        >
          <option value="all">Todas as vagas</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
        <Badge tone="neutral">{summary.total} candidatos</Badge>
        <Badge tone="info">{summary.advanced} avançaram</Badge>
        <Badge tone="danger">{summary.declined} declinados</Badge>
        <Badge tone="success">{summary.hired} contratados</Badge>
        {canWrite ? (
          <Link href={newCandidateHref} className={`${btnPrimary} px-3 py-2 text-xs`}>
            + Candidato
          </Link>
        ) : null}
        {jobFilter !== "all" ? (
          <Link href={`/vagas/${jobFilter}`} className={btnLink}>
            Resumo da vaga
          </Link>
        ) : null}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageCandidates = filtered.filter((c) => c.stageId === stage.id);
          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)]"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold tracking-tight text-[var(--foreground)]">
                    {stage.name}
                  </h3>
                  <Badge tone={stage.isTerminal ? "success" : "neutral"}>
                    {stageCandidates.length}
                  </Badge>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-3">
                {stageCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    stages={stages}
                    currentStage={stage}
                    canWrite={canWrite}
                  />
                ))}
                {stageCandidates.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[var(--muted)]">Sem candidatos</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  stages,
  currentStage,
  canWrite,
}: {
  candidate: Candidate;
  stages: Stage[];
  currentStage: Stage;
  canWrite: boolean;
}) {
  const nextStages = stages.filter(
    (s) => s.id !== currentStage.id && s.order >= currentStage.order,
  );

  return (
    <div className="ui-kanban-card rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
      <Link
        href={`/candidatos/${candidate.id}`}
        className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
      >
        {candidate.name}
      </Link>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {candidate.jobOpening?.title ?? "Sem vaga"} · {candidate.source ?? "Origem N/I"}
      </p>
      {candidate.owner ? (
        <p className="mt-1 text-xs text-[var(--muted)]">Resp.: {candidate.owner.name}</p>
      ) : null}
      {candidate.declineReason ? (
        <p className="mt-2 text-xs text-red-600">Declínio: {candidate.declineReason}</p>
      ) : null}

      {canWrite ? (
        <>
          <div className="mt-2">
            <Link href={`/candidatos/${candidate.id}/editar`} className={btnLink}>
              Editar
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {nextStages.slice(0, 4).map((stage) => (
              <MoveForm key={stage.id} candidateId={candidate.id} stage={stage} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MoveForm({
  candidateId,
  stage,
}: {
  candidateId: string;
  stage: Stage;
}) {
  const isDeclined = stage.terminalType === "DECLINED";

  return (
    <form action={moveCandidateAction} className="flex gap-1">
      <input type="hidden" name="candidateId" value={candidateId} />
      <input type="hidden" name="stageId" value={stage.id} />
      <input type="hidden" name="returnTo" value="/recrutamento" />
      {isDeclined ? (
        <input
          name="declineReason"
          placeholder="Motivo declínio"
          required
          className="min-w-0 flex-1 rounded border border-[var(--border)] px-2 py-1 text-xs"
        />
      ) : null}
      <button
        type="submit"
        className="ui-press shrink-0 rounded bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-900"
      >
        → {stage.name}
      </button>
    </form>
  );
}
