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
import { updateJobScoped } from "@/lib/scoped-update";
import { requireSession } from "@/lib/session";
import { scopedWhere } from "@/lib/tenant";
import {
  parseIntField,
  parseOptionalString,
  parseString,
  required,
} from "@/lib/validation";
import type { EmploymentType, JobStatus, TaskPriority } from "@/generated/prisma/client";

export async function createJobAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "job:write");

  const errors: Record<string, string> = {};
  const title = parseString(formData, "title");
  const titleErr = required(title, "Título");
  if (titleErr) errors.title = titleErr;

  const qtyResult = parseIntField(formData, "quantity", "Quantidade");
  if (!qtyResult.ok) Object.assign(errors, qtyResult.errors);

  if (Object.keys(errors).length) redirectWithValidationErrors("/vagas/nova", errors);

  const job = await prisma.jobOpening.create({
    data: {
      organizationId: session.activeOrganizationId,
      title,
      area: parseOptionalString(formData, "area"),
      seniority: parseOptionalString(formData, "seniority"),
      employmentType: (parseString(formData, "employmentType") || "CLT") as EmploymentType,
      quantity: qtyResult.ok ? qtyResult.data : 1,
      priority: (parseString(formData, "priority") || "MEDIUM") as TaskPriority,
      status: (parseString(formData, "status") || "OPEN") as JobStatus,
      ownerName: parseOptionalString(formData, "ownerName"),
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit(session, "job.create", "JobOpening", job.id, job.title);
  revalidatePath("/vagas");
  revalidatePath("/recrutamento");
  redirectWithSuccess(`/vagas/${job.id}`, "created");
}

export async function updateJobAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "job:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const title = parseString(formData, "title");
  const titleErr = required(title, "Título");
  if (titleErr) errors.title = titleErr;

  const qtyResult = parseIntField(formData, "quantity", "Quantidade");
  if (!qtyResult.ok) Object.assign(errors, qtyResult.errors);

  if (Object.keys(errors).length) redirectWithValidationErrors(`/vagas/${id}/editar`, errors);

  const existing = await prisma.jobOpening.findFirst({
    where: { id, ...scopedWhere(session), archivedAt: null },
  });
  if (!existing) redirectWithError("/vagas", "not_found");

  const result = await updateJobScoped(id, orgId, {
    title,
    area: parseOptionalString(formData, "area"),
    seniority: parseOptionalString(formData, "seniority"),
    employmentType: parseString(formData, "employmentType") as EmploymentType,
    quantity: qtyResult.ok ? qtyResult.data : 1,
    priority: parseString(formData, "priority") as TaskPriority,
    status: parseString(formData, "status") as JobStatus,
    ownerName: parseOptionalString(formData, "ownerName"),
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/vagas", "not_found");

  await logAudit(session, "job.update", "JobOpening", id, title);
  revalidatePath("/vagas");
  revalidatePath(`/vagas/${id}`);
  revalidatePath("/recrutamento");
  redirectWithSuccess(`/vagas/${id}`, "updated");
}

export async function archiveJobAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "job:archive");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const result = await updateJobScoped(id, orgId, {
    archivedAt: new Date(),
    status: "CLOSED",
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/vagas", "not_found");

  await logAudit(session, "job.archive", "JobOpening", id);
  revalidatePath("/vagas");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/vagas", "archived");
}

export async function closeJobAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "job:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const result = await updateJobScoped(id, orgId, {
    status: "CLOSED",
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/vagas", "not_found");

  await logAudit(session, "job.update", "JobOpening", id, "status:CLOSED");
  revalidatePath("/vagas");
  revalidatePath(`/vagas/${id}`);
  redirectWithSuccess(`/vagas/${id}`, "updated");
}
