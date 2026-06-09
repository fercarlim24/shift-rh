import { redirect } from "next/navigation";
import {
  canCreateOrganization,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import { requireSession } from "@/lib/session";

export async function requirePagePermission(permission: Permission, returnPath = "/dashboard") {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    redirect(`${returnPath}?error=forbidden`);
  }
  return session;
}

export async function requirePageCreateOrganization(returnPath = "/clientes") {
  const session = await requireSession();
  if (!canCreateOrganization(session.user.role)) {
    redirect(`${returnPath}?error=forbidden`);
  }
  return session;
}
