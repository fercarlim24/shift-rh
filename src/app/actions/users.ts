"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import {
  redirectWithError,
  redirectWithSuccess,
  redirectWithValidationErrors,
} from "@/lib/action-utils";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { email, parseOptionalString, parseString, required } from "@/lib/validation";
import type { UserRole } from "@/generated/prisma/client";

async function requireAdmin(session: Awaited<ReturnType<typeof requireSession>>) {
  await requirePermission(session, "user:write", "/usuarios");
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  await requireAdmin(session);

  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const emailVal = parseString(formData, "email");
  const password = parseString(formData, "password");

  if (required(name, "Nome")) errors.name = required(name, "Nome")!;
  if (required(emailVal, "E-mail")) errors.email = required(emailVal, "E-mail")!;
  const emailErr = email(emailVal);
  if (emailErr) errors.email = emailErr;
  if (required(password, "Senha")) errors.password = required(password, "Senha")!;

  if (Object.keys(errors).length) redirectWithValidationErrors("/usuarios/novo", errors);

  const existing = await prisma.user.findUnique({ where: { email: emailVal } });
  if (existing) redirectWithValidationErrors("/usuarios/novo", { email: "E-mail já cadastrado" });

  const user = await prisma.user.create({
    data: {
      name,
      email: emailVal,
      password: await hashPassword(password),
      role: (parseString(formData, "role") || "SHIFT_CONSULTANT") as UserRole,
      organizationId: parseOptionalString(formData, "organizationId"),
    },
  });

  await logAudit(session, "org.create", "User", user.id, user.email);
  revalidatePath("/usuarios");
  redirectWithSuccess(`/usuarios/${user.id}`, "created");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireSession();
  await requireAdmin(session);

  const id = parseString(formData, "id");
  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  const emailVal = parseString(formData, "email");
  const newPassword = parseString(formData, "password");

  if (required(name, "Nome")) errors.name = required(name, "Nome")!;
  if (required(emailVal, "E-mail")) errors.email = required(emailVal, "E-mail")!;
  const emailErr = email(emailVal);
  if (emailErr) errors.email = emailErr;

  if (Object.keys(errors).length) redirectWithValidationErrors(`/usuarios/${id}/editar`, errors);

  const user = await prisma.user.findFirst({ where: { id, archivedAt: null } });
  if (!user) redirectWithError("/usuarios", "not_found");

  const data: {
    name: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
    password?: string;
  } = {
    name,
    email: emailVal,
    role: parseString(formData, "role") as UserRole,
    organizationId: parseOptionalString(formData, "organizationId"),
  };

  if (newPassword) {
    data.password = await hashPassword(newPassword);
  }

  await prisma.user.update({ where: { id }, data });
  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${id}`);
  redirectWithSuccess(`/usuarios/${id}`, "updated");
}

export async function archiveUserAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "user:archive", "/usuarios");

  const id = parseString(formData, "id");
  if (id === session.user.id) redirectWithError("/usuarios", "forbidden");

  const user = await prisma.user.findFirst({ where: { id, archivedAt: null } });
  if (!user) redirectWithError("/usuarios", "not_found");

  await prisma.user.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/usuarios");
  redirectWithSuccess("/usuarios", "archived");
}

export async function grantOrganizationAccessAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "user:access", "/usuarios");

  const userId = parseString(formData, "userId");
  const organizationId = parseString(formData, "organizationId");

  const user = await prisma.user.findFirst({
    where: { id: userId, archivedAt: null, role: "SHIFT_CONSULTANT" },
  });
  if (!user) redirectWithError(`/usuarios/${userId}/acessos`, "not_found");

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, archivedAt: null },
  });
  if (!org) redirectWithError(`/usuarios/${userId}/acessos`, "not_found");

  await prisma.userOrganizationAccess.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    create: { userId, organizationId },
    update: {},
  });

  revalidatePath(`/usuarios/${userId}/acessos`);
  revalidatePath(`/usuarios/${userId}`);
  redirectWithSuccess(`/usuarios/${userId}/acessos`, "success");
}

export async function revokeOrganizationAccessAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "user:access", "/usuarios");

  const accessId = parseString(formData, "accessId") || parseString(formData, "id");
  const userId = parseString(formData, "userId");

  const access = await prisma.userOrganizationAccess.findUnique({
    where: { id: accessId },
  });
  if (!access || access.userId !== userId) {
    redirectWithError(`/usuarios/${userId}/acessos`, "not_found");
  }

  await prisma.userOrganizationAccess.delete({ where: { id: accessId } });

  revalidatePath(`/usuarios/${userId}/acessos`);
  redirectWithSuccess(`/usuarios/${userId}/acessos`, "deleted");
}
