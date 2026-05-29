"use client";

import { useMemo, useState } from "react";
import { moveCandidateAction } from "@/app/actions";
import { Badge } from "@/components/app-shell";

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
}: {
  stages: Stage[];
  candidates: Candidate[];
  jobs: { id: string; title: string }[];
}) {
  const [jobFilter, setJobFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (jobFilter === "all") return candidates;
    return candidates.filter((c) => c.jobOpening?.id === jobFilter);
  }, [candidates, jobFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="jobFilter" className="text-sm font-medium text-slate-700">
          Filtrar por vaga
        </label>
        <select
          id="jobFilter"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Todas as vagas</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
        <Badge tone="neutral">{filtered.length} candidatos</Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageCandidates = filtered.filter((c) => c.stageId === stage.id);
          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/80"
            >
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{stage.name}</h3>
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
                  />
                ))}
                {stageCandidates.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">Sem candidatos</p>
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
}: {
  candidate: Candidate;
  stages: Stage[];
  currentStage: Stage;
}) {
  const nextStages = stages.filter((s) => s.id !== currentStage.id && s.order >= currentStage.order);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="font-medium text-slate-900">{candidate.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {candidate.jobOpening?.title ?? "Sem vaga"} · {candidate.source ?? "Origem N/I"}
      </p>
      {candidate.owner ? (
        <p className="mt-1 text-xs text-slate-500">Resp.: {candidate.owner.name}</p>
      ) : null}
      {candidate.declineReason ? (
        <p className="mt-2 text-xs text-red-600">Declínio: {candidate.declineReason}</p>
      ) : null}

      <div className="mt-3 space-y-1">
        {nextStages.slice(0, 3).map((stage) => (
          <MoveForm
            key={stage.id}
            candidateId={candidate.id}
            stage={stage}
          />
        ))}
      </div>
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
      {isDeclined ? (
        <input
          name="declineReason"
          placeholder="Motivo declínio"
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
        />
      ) : null}
      <button
        type="submit"
        className="shrink-0 rounded bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-900"
      >
        → {stage.name}
      </button>
    </form>
  );
}
