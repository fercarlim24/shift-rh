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
import { updateTaskScoped } from "@/lib/scoped-update";
import { requireSession } from "@/lib/session";
import { scopedWhere } from "@/lib/tenant";
import {
  validateCandidateInOrg,
  validateJobInOrg,
  validateOnboardingInOrg,
} from "@/lib/validate-relations";
import {
  parseDateField,
  parseOptionalString,
  parseString,
  required,
} from "@/lib/validation";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";

function taskWhere(session: Awaited<ReturnType<typeof requireSession>>) {
  if (session.user.role === "COLLABORATOR") {
    return { ...scopedWhere(session), assigneeId: session.user.id, archivedAt: null };
  }
  return { ...scopedWhere(session), archivedAt: null };
}

async function validateTaskRelations(
  orgId: string,
  relations: {
    jobOpeningId: string | null;
    candidateId: string | null;
    onboardingId: string | null;
  },
) {
  if (!(await validateJobInOrg(relations.jobOpeningId, orgId))) return false;
  if (!(await validateCandidateInOrg(relations.candidateId, orgId))) return false;
  if (!(await validateOnboardingInOrg(relations.onboardingId, orgId))) return false;
  return true;
}

export async function createTaskAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "task:write");

  const errors: Record<string, string> = {};
  const title = parseString(formData, "title");
  const titleErr = required(title, "Título");
  if (titleErr) errors.title = titleErr;
  if (Object.keys(errors).length) redirectWithValidationErrors("/tarefas/nova", errors);

  const orgId = session.activeOrganizationId;
  const jobOpeningId = parseOptionalString(formData, "jobOpeningId");
  const candidateId = parseOptionalString(formData, "candidateId");
  const onboardingId = parseOptionalString(formData, "onboardingId");

  if (!(await validateTaskRelations(orgId, { jobOpeningId, candidateId, onboardingId }))) {
    redirectWithError("/tarefas/nova", "not_found");
  }

  const task = await prisma.task.create({
    data: {
      organizationId: orgId,
      title,
      description: parseOptionalString(formData, "description"),
      status: (parseString(formData, "status") || "TODO") as TaskStatus,
      priority: (parseString(formData, "priority") || "MEDIUM") as TaskPriority,
      dueDate: parseDateField(formData, "dueDate"),
      assigneeId: parseOptionalString(formData, "assigneeId"),
      jobOpeningId,
      candidateId,
      onboardingId,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit(session, "task.create", "Task", task.id, title);
  revalidatePath("/tarefas");
  redirectWithSuccess(`/tarefas/${task.id}`, "created");
}

export async function updateTaskAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "task:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const title = parseString(formData, "title");
  const titleErr = required(title, "Título");
  if (titleErr) errors.title = titleErr;
  if (Object.keys(errors).length) redirectWithValidationErrors(`/tarefas/${id}/editar`, errors);

  const existing = await prisma.task.findFirst({ where: { id, ...taskWhere(session) } });
  if (!existing) redirectWithError("/tarefas", "not_found");

  const jobOpeningId = parseOptionalString(formData, "jobOpeningId");
  const candidateId = parseOptionalString(formData, "candidateId");
  const onboardingId = parseOptionalString(formData, "onboardingId");

  if (!(await validateTaskRelations(orgId, { jobOpeningId, candidateId, onboardingId }))) {
    redirectWithError(`/tarefas/${id}/editar`, "not_found");
  }

  const result = await updateTaskScoped(id, orgId, {
    title,
    description: parseOptionalString(formData, "description"),
    status: parseString(formData, "status") as TaskStatus,
    priority: parseString(formData, "priority") as TaskPriority,
    dueDate: parseDateField(formData, "dueDate"),
    assigneeId: parseOptionalString(formData, "assigneeId"),
    jobOpeningId,
    candidateId,
    onboardingId,
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/tarefas", "not_found");

  await logAudit(session, "task.update", "Task", id, title);
  revalidatePath("/tarefas");
  revalidatePath(`/tarefas/${id}`);
  redirectWithSuccess(`/tarefas/${id}`, "updated");
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "task:write");

  const taskId = parseString(formData, "taskId");
  const status = parseString(formData, "status") as TaskStatus;

  await prisma.task.updateMany({
    where: { id: taskId, ...taskWhere(session) },
    data: { status, updatedById: session.user.id },
  });

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
}

export async function archiveTaskAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "task:archive");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const existing = await prisma.task.findFirst({ where: { id, ...taskWhere(session) } });
  if (!existing) redirectWithError("/tarefas", "not_found");

  await updateTaskScoped(id, orgId, {
    archivedAt: new Date(),
    status: "ARCHIVED",
    updatedById: session.user.id,
  });

  await logAudit(session, "task.archive", "Task", id);
  revalidatePath("/tarefas");
  redirectWithSuccess("/tarefas", "archived");
}
