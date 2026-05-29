import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export const SESSION_COOKIE = "shift_rh_session";

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

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.user?.id || !parsed.activeOrganizationId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
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

export async function login(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) return null;

  let activeOrganizationId = user.organizationId;

  if (!activeOrganizationId) {
    const firstOrg = await prisma.organization.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
    activeOrganizationId = firstOrg?.id ?? null;
  }

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

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return null;

  const updated: Session = { ...session, activeOrganizationId: organizationId };
  await setSessionCookie(updated);
  return updated;
}
