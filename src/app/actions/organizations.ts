"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import {
  redirectWithError,
  redirectWithSuccess,
  redirectWithValidationErrors,
} from "@/lib/action-utils";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/default-pipeline-stages";
import { requireCreateOrganization, requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { parseOptionalString, parseString, required } from "@/lib/validation";

export async function createOrganizationAction(formData: FormData) {
  const session = await requireSession();
  await requireCreateOrganization(session, "/clientes");

  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const err = required(name, "Nome");
  if (err) errors.name = err;
  if (Object.keys(errors).length) redirectWithValidationErrors("/clientes/novo", errors);

  const org = await prisma.organization.create({
    data: {
      name,
      tradeName: parseOptionalString(formData, "tradeName"),
      cnpj: parseOptionalString(formData, "cnpj"),
      city: parseOptionalString(formData, "city"),
      region: parseOptionalString(formData, "region"),
      createdById: session.user.id,
      updatedById: session.user.id,
      pipelineStages: {
        create: DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage })),
      },
    },
  });

  await logAudit(session, "org.create", "Organization", org.id, org.name, org.id);
  revalidatePath("/clientes");
  redirectWithSuccess(`/clientes/${org.id}`, "created");
}

export async function updateOrganizationAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "org:write");

  const id = parseString(formData, "id");
  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const err = required(name, "Nome");
  if (err) errors.name = err;
  if (Object.keys(errors).length) redirectWithValidationErrors(`/clientes/${id}/editar`, errors);

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing || existing.archivedAt) redirectWithError("/clientes", "not_found");

  await prisma.organization.update({
    where: { id },
    data: {
      name,
      tradeName: parseOptionalString(formData, "tradeName"),
      cnpj: parseOptionalString(formData, "cnpj"),
      city: parseOptionalString(formData, "city"),
      region: parseOptionalString(formData, "region"),
      status: parseString(formData, "status") || "ACTIVE",
      updatedById: session.user.id,
    },
  });

  await logAudit(session, "org.update", "Organization", id, undefined, id);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirectWithSuccess(`/clientes/${id}`, "updated");
}

export async function archiveOrganizationAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "org:archive");

  const id = parseString(formData, "id");
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing || existing.archivedAt) redirectWithError("/clientes", "not_found");

  await prisma.organization.update({
    where: { id },
    data: { archivedAt: new Date(), status: "ARCHIVED", updatedById: session.user.id },
  });

  await logAudit(session, "org.archive", "Organization", id, undefined, id);
  revalidatePath("/clientes");
  redirectWithSuccess("/clientes", "archived");
}
