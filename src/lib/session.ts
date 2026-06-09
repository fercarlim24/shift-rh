import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";
import { parseSessionValue, signSessionValue } from "@/lib/auth/session-cookie";
import { verifyPassword } from "@/lib/auth/password";
import { canAccessOrganization } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export { SESSION_COOKIE };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
};

export type Session = {
  user: SessionUser;
  activeOrganizationId: string;
};

export function parseSessionCookie(raw: string | undefined): Session | null {
  if (!raw) return null;
  return parseSessionValue(raw);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionCookie(raw);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSessionValue(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function resolveActiveOrganizationId(
  user: { organizationId: string | null; role: UserRole; id: string },
): Promise<string | null> {
  if (user.organizationId) return user.organizationId;

  if (user.role === "CLIENT_VIEWER" || user.role === "COLLABORATOR") {
    return user.organizationId;
  }

  const access = await prisma.userOrganizationAccess.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (user.role === "SHIFT_CONSULTANT" && access.length > 0) {
    return access[0]?.organizationId ?? null;
  }

  if (access.length > 0) return access[0]?.organizationId ?? null;

  const firstOrg = await prisma.organization.findFirst({
    where: { status: "ACTIVE", archivedAt: null },
    orderBy: { name: "asc" },
  });
  return firstOrg?.id ?? null;
}

export async function login(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findFirst({
    where: { email, archivedAt: null },
  });
  if (!user) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  const activeOrganizationId = await resolveActiveOrganizationId(user);
  if (!activeOrganizationId) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    },
    activeOrganizationId,
  };
}

export async function switchOrganization(organizationId: string): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, status: "ACTIVE", archivedAt: null },
  });
  if (!org) return null;

  const allowed = await canAccessOrganization(session, organizationId);
  if (!allowed) return null;

  const updated: Session = { ...session, activeOrganizationId: organizationId };
  await setSessionCookie(updated);
  return updated;
}
