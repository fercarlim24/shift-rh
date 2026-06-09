import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessOrganization } from "@/lib/permissions";
import { requireSession, type Session } from "@/lib/session";

export async function getCurrentOrganizationId(): Promise<string> {
  const session = await requireSession();
  return session.activeOrganizationId;
}

export function scopedWhere<T extends { organizationId?: string }>(
  session: Session,
  extra?: T,
) {
  return { organizationId: session.activeOrganizationId, ...extra };
}

export async function requireOrganizationAccess(
  organizationId: string,
  session?: Session,
): Promise<Session> {
  const current = session ?? (await requireSession());
  const allowed = await canAccessOrganization(current, organizationId);
  if (!allowed) notFound();
  return current;
}

export async function getAccessibleOrganizations(session: Session) {
  if (session.user.role === "SHIFT_ADMIN") {
    return prisma.organization.findMany({
      where: { status: "ACTIVE", archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, tradeName: true },
    });
  }

  if (session.user.role === "CLIENT_VIEWER" || session.user.role === "COLLABORATOR") {
    if (!session.user.organizationId) return [];
    const org = await prisma.organization.findFirst({
      where: {
        id: session.user.organizationId,
        status: "ACTIVE",
        archivedAt: null,
      },
      select: { id: true, name: true, tradeName: true },
    });
    return org ? [org] : [];
  }

  const access = await prisma.userOrganizationAccess.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true, name: true, tradeName: true, status: true, archivedAt: true },
      },
    },
  });

  return access
    .map((a) => a.organization)
    .filter((o) => o.status === "ACTIVE" && !o.archivedAt)
    .map(({ id, name, tradeName }) => ({ id, name, tradeName }));
}

export async function findScopedOrNotFound<T>(
  finder: () => Promise<T | null>,
): Promise<T> {
  const result = await finder();
  if (!result) notFound();
  return result;
}
