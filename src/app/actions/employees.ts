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
import { updateEmployeeScoped } from "@/lib/scoped-update";
import { requireSession } from "@/lib/session";
import { scopedWhere } from "@/lib/tenant";
import {
  parseDateField,
  parseOptionalString,
  parseString,
  required,
} from "@/lib/validation";
import type { EmploymentType } from "@/generated/prisma/client";

export async function createEmployeeAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "employee:write");

  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const nameErr = required(name, "Nome");
  if (nameErr) errors.name = nameErr;
  if (Object.keys(errors).length) redirectWithValidationErrors("/colaboradores/novo", errors);

  const employee = await prisma.employee.create({
    data: {
      organizationId: session.activeOrganizationId,
      name,
      email: parseOptionalString(formData, "email"),
      document: parseOptionalString(formData, "document"),
      employmentType: (parseString(formData, "employmentType") || "CLT") as EmploymentType,
      role: parseOptionalString(formData, "role"),
      area: parseOptionalString(formData, "area"),
      startDate: parseDateField(formData, "startDate"),
      pjCompanyName: parseOptionalString(formData, "pjCompanyName"),
      pjCnpj: parseOptionalString(formData, "pjCnpj"),
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit(session, "employee.create", "Employee", employee.id, name);
  revalidatePath("/colaboradores");
  revalidatePath("/clientes");
  redirectWithSuccess(`/colaboradores/${employee.id}`, "created");
}

export async function updateEmployeeAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "employee:write");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const nameErr = required(name, "Nome");
  if (nameErr) errors.name = nameErr;
  if (Object.keys(errors).length) redirectWithValidationErrors(`/colaboradores/${id}/editar`, errors);

  const existing = await prisma.employee.findFirst({
    where: { id, ...scopedWhere(session), archivedAt: null },
  });
  if (!existing) redirectWithError("/colaboradores", "not_found");

  const result = await updateEmployeeScoped(id, orgId, {
    name,
    email: parseOptionalString(formData, "email"),
    document: parseOptionalString(formData, "document"),
    employmentType: parseString(formData, "employmentType") as EmploymentType,
    role: parseOptionalString(formData, "role"),
    area: parseOptionalString(formData, "area"),
    startDate: parseDateField(formData, "startDate"),
    status: parseString(formData, "status") || "ACTIVE",
    pjCompanyName: parseOptionalString(formData, "pjCompanyName"),
    pjCnpj: parseOptionalString(formData, "pjCnpj"),
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/colaboradores", "not_found");

  await logAudit(session, "employee.update", "Employee", id, name);
  revalidatePath("/colaboradores");
  revalidatePath(`/colaboradores/${id}`);
  redirectWithSuccess(`/colaboradores/${id}`, "updated");
}

export async function archiveEmployeeAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "employee:archive");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;

  const result = await updateEmployeeScoped(id, orgId, {
    archivedAt: new Date(),
    status: "ARCHIVED",
    updatedById: session.user.id,
  });
  if (result.count === 0) redirectWithError("/colaboradores", "not_found");

  await logAudit(session, "employee.update", "Employee", id, "archived");
  revalidatePath("/colaboradores");
  redirectWithSuccess("/colaboradores", "archived");
}
