import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/session";

export type AuditAction =
  | "job.create"
  | "job.update"
  | "job.archive"
  | "candidate.create"
  | "candidate.update"
  | "candidate.move"
  | "candidate.archive"
  | "onboarding.create"
  | "onboarding.update"
  | "onboarding.send_signature"
  | "employee.create"
  | "employee.update"
  | "org.create"
  | "org.update"
  | "org.archive"
  | "task.create"
  | "task.update"
  | "task.archive";

export async function logAudit(
  session: Session,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: string,
  organizationId?: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      organizationId: organizationId ?? session.activeOrganizationId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}
