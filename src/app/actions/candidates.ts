"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import {
  redirectWithError,
  redirectWithSuccess,
  redirectWithValidationErrors,
} from "@/lib/action-utils";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateCandidateScoped } from "@/lib/scoped-update";
import { requireSession } from "@/lib/session";
import { scopedWhere } from "@/lib/tenant";
import {
  validateJobInOrg,
  validateStageInOrg,
} from "@/lib/validate-relations";
import { email, parseOptionalString, parseString, required } from "@/lib/validation";

async function getFirstStage(organizationId: string) {
  return prisma.pipelineStage.findFirst({
    where: { organizationId, archivedAt: null },
    orderBy: { order: "asc" },
  });
}

export async function createCandidateAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "candidate:write");

  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const nameErr = required(name, "Nome");
  if (nameErr) errors.name = nameErr;

  const emailVal = parseOptionalString(formData, "email") ?? "";
  const emailErr = emailVal ? email(emailVal) : null;
  if (emailErr) errors.email = emailErr;

  if (Object.keys(errors).length) {
    const returnTo = parseString(formData, "returnTo") || "/candidatos/novo";
    redirectWithValidationErrors(returnTo, errors);
  }

  const orgId = session.activeOrganizationId;
  let stageId = parseOptionalString(formData, "stageId");
  if (!stageId) {
    const first = await getFirstStage(orgId);
    if (!first) redirectWithError("/candidatos/novo", "error");
    stageId = first.id;
  } else if (!(await validateStageInOrg(stageId, orgId))) {
    redirectWithError("/candidatos/novo", "not_found");
  }

  const jobOpeningId = parseOptionalString(formData, "jobOpeningId");
  if (jobOpeningId && !(await validateJobInOrg(jobOpeningId, orgId))) {
    redirectWithError("/candidatos/novo", "not_found");
  }

  const ownerId = parseOptionalString(formData, "ownerId");

  const candidate = await prisma.candidate.create({
    data: {
      organizationId: orgId,
      name,
      email: emailVal || null,
      phone: parseOptionalString(formData, "phone"),
      source: parseOptionalString(formData, "source"),
      notes: parseOptionalString(formData, "notes"),
      jobOpeningId,
      stageId,
      ownerId,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit(session, "candidate.create", "Candidate", candidate.id, name);
  revalidatePath("/candidatos");
  revalidatePath("/recrutamento");
  if (jobOpeningId) revalidatePath(`/vagas/${jobOpeningId}/candidatos`);

  const returnTo = parseString(formData, "returnTo");
  redirectWithSuccess(returnTo ? returnTo : `/candidatos/${candidate.id}`, "created");
}

export async function updateCandidateAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "candidate:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const nameErr = required(name, "Nome");
  if (nameErr) errors.name = nameErr;

  const emailVal = parseOptionalString(formData, "email") ?? "";
  const emailErr = emailVal ? email(emailVal) : null;
  if (emailErr) errors.email = emailErr;

  if (Object.keys(errors).length) redirectWithValidationErrors(`/candidatos/${id}/editar`, errors);

  const found = await prisma.candidate.findFirst({
    where: { id, ...scopedWhere(session), archivedAt: null },
  });
  if (!found) redirectWithError("/candidatos", "not_found");

  const jobOpeningId = parseOptionalString(formData, "jobOpeningId");
  const stageId = parseString(formData, "stageId") || found.stageId;

  if (!(await validateStageInOrg(stageId, orgId))) {
    redirectWithError(`/candidatos/${id}/editar`, "not_found");
  }
  if (jobOpeningId && !(await validateJobInOrg(jobOpeningId, orgId))) {
    redirectWithError(`/candidatos/${id}/editar`, "not_found");
  }

  const result = await updateCandidateScoped(id, orgId, {
    name,
    email: emailVal || null,
    phone: parseOptionalString(formData, "phone"),
    source: parseOptionalString(formData, "source"),
    notes: parseOptionalString(formData, "notes"),
    jobOpeningId,
    stageId,
    ownerId: parseOptionalString(formData, "ownerId"),
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/candidatos", "not_found");

  await logAudit(session, "candidate.update", "Candidate", id, name);
  revalidatePath("/candidatos");
  revalidatePath(`/candidatos/${id}`);
  revalidatePath("/recrutamento");
  redirectWithSuccess(`/candidatos/${id}`, "updated");
}

export async function archiveCandidateAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "candidate:archive");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const result = await updateCandidateScoped(id, orgId, {
    archivedAt: new Date(),
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/candidatos", "not_found");

  await logAudit(session, "candidate.archive", "Candidate", id);
  revalidatePath("/candidatos");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/candidatos", "archived");
}

export async function moveCandidateAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "pipeline:move");

  const candidateId = parseString(formData, "candidateId");
  const stageId = parseString(formData, "stageId");
  const declineReason = parseString(formData, "declineReason");
  const orgId = session.activeOrganizationId;

  const returnPath = parseString(formData, "returnTo") || "/recrutamento";

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, ...scopedWhere(session), archivedAt: null },
  });
  if (!candidate) redirectWithError(returnPath, "not_found");

  if (!(await validateStageInOrg(stageId, orgId))) {
    redirectWithError(returnPath, "not_found");
  }

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, organizationId: orgId, archivedAt: null },
  });
  if (!stage) redirectWithError(returnPath, "not_found");

  const result = await updateCandidateScoped(candidateId, orgId, {
    stageId,
    declineReason:
      stage.terminalType === "DECLINED" ? declineReason || "Não informado" : null,
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError(returnPath, "not_found");

  await logAudit(
    session,
    "candidate.move",
    "Candidate",
    candidateId,
    `stage:${stage.name}`,
  );

  revalidatePath("/recrutamento");
  revalidatePath("/dashboard");
  revalidatePath("/candidatos");
  if (candidate.jobOpeningId) {
    revalidatePath(`/vagas/${candidate.jobOpeningId}`);
    revalidatePath(`/vagas/${candidate.jobOpeningId}/candidatos`);
  }

  redirectWithSuccess(returnPath, "moved");
}
