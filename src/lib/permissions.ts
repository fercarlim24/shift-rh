import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/session";
import {
  canAccessAppRoute,
  canCreateOrganization,
  canViewAllOrganizations,
  hasPermission,
  navItemsForRole,
  type Permission,
} from "@/lib/rbac";

export type { Permission };
export {
  canAccessAppRoute,
  canCreateOrganization,
  canViewAllOrganizations,
  hasPermission,
  navItemsForRole,
};

export async function requirePermission(
  session: Session,
  permission: Permission,
  returnPath = "/dashboard",
): Promise<void> {
  if (!hasPermission(session.user.role, permission)) {
    redirect(`${returnPath}?error=forbidden`);
  }
}

export async function requireCreateOrganization(
  session: Session,
  returnPath = "/clientes",
): Promise<void> {
  if (!canCreateOrganization(session.user.role)) {
    redirect(`${returnPath}?error=forbidden`);
  }
}

export async function canAccessOrganization(
  session: Session,
  organizationId: string,
): Promise<boolean> {
  if (session.user.role === "SHIFT_ADMIN") return true;

  if (session.user.role === "CLIENT_VIEWER" || session.user.role === "COLLABORATOR") {
    return session.user.organizationId === organizationId;
  }

  if (session.user.role === "SHIFT_CONSULTANT") {
    const explicit = await prisma.userOrganizationAccess.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });
    return !!explicit;
  }

  return false;
}
