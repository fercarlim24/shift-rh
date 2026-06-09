"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import {
  redirectWithError,
  redirectWithSuccess,
  redirectWithValidationErrors,
} from "@/lib/action-utils";
import { autentiqueService } from "@/lib/integrations";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateOnboardingScoped } from "@/lib/scoped-update";
import { requireSession } from "@/lib/session";
import { scopedWhere } from "@/lib/tenant";
import { validateCandidateInOrg } from "@/lib/validate-relations";
import { parseOptionalString, parseString, required } from "@/lib/validation";
import type { EmploymentType, OnboardingStatus } from "@/generated/prisma/client";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

async function addOnboardingEvent(
  onboardingId: string,
  type: string,
  message: string,
  createdById: string,
) {
  await prisma.onboardingEvent.create({
    data: { onboardingId, type, message, createdById },
  });
}

async function requireOnboardingScoped(
  session: Awaited<ReturnType<typeof requireSession>>,
  onboardingId: string,
  returnPath: string,
) {
  const onboarding = await prisma.onboarding.findFirst({
    where: { id: onboardingId, ...scopedWhere(session), archivedAt: null },
    include: { organization: true },
  });
  if (!onboarding) redirectWithError(returnPath, "not_found");
  return onboarding;
}

export async function createOnboardingAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:write");

  const errors: Record<string, string> = {};
  const employeeName = parseString(formData, "employeeName");
  const nameErr = required(employeeName, "Nome do colaborador");
  if (nameErr) errors.employeeName = nameErr;
  if (Object.keys(errors).length) redirectWithValidationErrors("/admissoes/nova", errors);

  const orgId = session.activeOrganizationId;
  const candidateId = parseOptionalString(formData, "candidateId");
  if (candidateId && !(await validateCandidateInOrg(candidateId, orgId))) {
    redirectWithError("/admissoes/nova", "not_found");
  }

  const onboarding = await prisma.onboarding.create({
    data: {
      organizationId: orgId,
      employeeName,
      employmentType: (parseString(formData, "employmentType") || "CLT") as EmploymentType,
      candidateId,
      responsibleId: parseOptionalString(formData, "responsibleId") ?? session.user.id,
      status: "STARTED",
      documents: { files: [] },
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await addOnboardingEvent(onboarding.id, "created", "Admissão iniciada", session.user.id);
  await logAudit(session, "onboarding.create", "Onboarding", onboarding.id, employeeName);
  revalidatePath("/admissoes");
  redirectWithSuccess(`/admissoes/${onboarding.id}`, "created");
}

export async function updateOnboardingAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const employeeName = parseString(formData, "employeeName");
  const nameErr = required(employeeName, "Nome do colaborador");
  if (nameErr) errors.employeeName = nameErr;
  if (Object.keys(errors).length) redirectWithValidationErrors(`/admissoes/${id}/editar`, errors);

  const found = await prisma.onboarding.findFirst({
    where: { id, ...scopedWhere(session), archivedAt: null },
  });
  if (!found) redirectWithError("/admissoes", "not_found");

  const candidateId = parseOptionalString(formData, "candidateId");
  if (candidateId && !(await validateCandidateInOrg(candidateId, orgId))) {
    redirectWithError(`/admissoes/${id}/editar`, "not_found");
  }

  const status = parseString(formData, "status") as OnboardingStatus;

  const result = await updateOnboardingScoped(id, orgId, {
    employeeName,
    employmentType: parseString(formData, "employmentType") as EmploymentType,
    candidateId,
    responsibleId: parseOptionalString(formData, "responsibleId"),
    status: status || found.status,
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/admissoes", "not_found");

  await addOnboardingEvent(id, "updated", "Dados da admissão atualizados", session.user.id);
  await logAudit(session, "onboarding.update", "Onboarding", id, employeeName);
  revalidatePath("/admissoes");
  revalidatePath(`/admissoes/${id}`);
  redirectWithSuccess(`/admissoes/${id}`, "updated");
}

export async function archiveOnboardingAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:archive");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const result = await updateOnboardingScoped(id, orgId, {
    archivedAt: new Date(),
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/admissoes", "not_found");

  revalidatePath("/admissoes");
  redirectWithSuccess("/admissoes", "archived");
}

export async function advanceOnboardingAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:write");

  const onboardingId = parseString(formData, "onboardingId");
  const returnPath = parseString(formData, "returnTo") || "/admissoes";
  const orgId = session.activeOrganizationId;

  const onboarding = await requireOnboardingScoped(session, onboardingId, returnPath);

  const nextStatus =
    onboarding.status === "STARTED"
      ? "DOCS_PENDING"
      : onboarding.status === "DOCS_PENDING"
        ? "SIGNATURE"
        : onboarding.status === "SIGNATURE"
          ? "COMPLETED"
          : "COMPLETED";

  const updateResult = await updateOnboardingScoped(onboardingId, orgId, {
    status: nextStatus,
    signatureStatus:
      nextStatus === "COMPLETED" ? "SIGNED" : onboarding.signatureStatus,
    updatedById: session.user.id,
  });
  if (updateResult.count === 0) redirectWithError(returnPath, "not_found");

  await addOnboardingEvent(
    onboardingId,
    "status_change",
    `Status alterado para ${nextStatus}`,
    session.user.id,
  );
  await logAudit(session, "onboarding.update", "Onboarding", onboardingId, `status:${nextStatus}`);

  revalidatePath("/admissoes");
  revalidatePath(`/admissoes/${onboardingId}`);
  redirectWithSuccess(returnPath, "success");
}

export async function sendToAutentiqueAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:write");

  const onboardingId = parseString(formData, "onboardingId");
  const returnPath = parseString(formData, "returnTo") || "/admissoes";
  const orgId = session.activeOrganizationId;

  const onboarding = await requireOnboardingScoped(session, onboardingId, returnPath);

  const result = await autentiqueService.sendDocument({
    employeeName: onboarding.employeeName,
    employmentType: onboarding.employmentType,
    organizationName: onboarding.organization.tradeName ?? onboarding.organization.name,
  });

  if (!result.ok) {
    await logAudit(session, "onboarding.send_signature", "Onboarding", onboardingId, result.error);
    redirectWithError(returnPath, "error");
  }

  const updateResult = await updateOnboardingScoped(onboardingId, orgId, {
    status: "SIGNATURE",
    signatureStatus: "PENDING",
    documents: {
      autentique: result.data,
      files: [{ name: result.data.name, status: "pending" }],
    },
    updatedById: session.user.id,
  });
  if (updateResult.count === 0) redirectWithError(returnPath, "not_found");

  await addOnboardingEvent(
    onboardingId,
    "signature_sent",
    `Documento enviado para Autentique (mock): ${result.data.id}`,
    session.user.id,
  );

  await logAudit(session, "onboarding.send_signature", "Onboarding", onboardingId);
  revalidatePath("/admissoes");
  revalidatePath(`/admissoes/${onboardingId}`);
  redirectWithSuccess(returnPath, "sent");
}

export async function uploadOnboardingDocumentAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "onboarding:write");

  const onboardingId = parseString(formData, "onboardingId");
  const returnPath = parseString(formData, "returnTo") || `/admissoes/${onboardingId}`;
  const orgId = session.activeOrganizationId;

  await requireOnboardingScoped(session, onboardingId, returnPath);

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    redirectWithError(returnPath, "validation");
  }

  const upload = file as File;
  if (upload.size > MAX_UPLOAD_BYTES) {
    redirectWithError(returnPath, "validation");
  }

  const buffer = Buffer.from(await upload.arrayBuffer());
  const doc = await prisma.onboardingDocument.create({
    data: {
      onboardingId,
      organizationId: orgId,
      filename: upload.name,
      mimeType: upload.type || "application/octet-stream",
      size: upload.size,
      contentBase64: buffer.toString("base64"),
      uploadedById: session.user.id,
    },
  });

  await addOnboardingEvent(
    onboardingId,
    "document_uploaded",
    `Documento anexado: ${upload.name}`,
    session.user.id,
  );
  await logAudit(session, "onboarding.update", "OnboardingDocument", doc.id, upload.name);

  revalidatePath(`/admissoes/${onboardingId}`);
  redirectWithSuccess(returnPath, "success");
}
