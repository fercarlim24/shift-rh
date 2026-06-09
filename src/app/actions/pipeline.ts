"use server";

import { revalidatePath } from "next/cache";
import {
  redirectWithError,
  redirectWithSuccess,
  redirectWithValidationErrors,
} from "@/lib/action-utils";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { parseIntField, parseOptionalString, parseString, required } from "@/lib/validation";

export async function createPipelineStageAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "pipeline:config", "/configuracoes/pipeline");

  const orgId = session.activeOrganizationId;
  const errors: Record<string, string> = {};
  const name = parseString(formData, "name");
  if (required(name, "Nome")) errors.name = required(name, "Nome")!;

  const orderResult = parseIntField(formData, "order", "Ordem");
  if (!orderResult.ok) Object.assign(errors, orderResult.errors);

  if (Object.keys(errors).length) redirectWithValidationErrors("/configuracoes/pipeline", errors);

  await prisma.pipelineStage.create({
    data: {
      organizationId: orgId,
      name,
      order: orderResult.ok ? orderResult.data - 1 : 0,
      isTerminal: parseString(formData, "isTerminal") === "true",
      terminalType: parseOptionalString(formData, "terminalType"),
    },
  });

  revalidatePath("/configuracoes/pipeline");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/configuracoes/pipeline", "created");
}

export async function updatePipelineStageAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "pipeline:config", "/configuracoes/pipeline");

  const id = parseString(formData, "id");
  const orgId = session.activeOrganizationId;
  const name = parseString(formData, "name");
  if (!name) redirectWithValidationErrors("/configuracoes/pipeline", { name: "Nome é obrigatório" });

  const stage = await prisma.pipelineStage.findFirst({
    where: { id, organizationId: orgId, archivedAt: null },
  });
  if (!stage) redirectWithError("/configuracoes/pipeline", "not_found");

  await prisma.pipelineStage.update({
    where: { id },
    data: { name, updatedAt: new Date() },
  });

  revalidatePath("/configuracoes/pipeline");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/configuracoes/pipeline", "updated");
}

export async function reorderPipelineStageAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "pipeline:config", "/configuracoes/pipeline");

  const id = parseString(formData, "id");
  const direction = parseString(formData, "direction");
  const orgId = session.activeOrganizationId;

  const stages = await prisma.pipelineStage.findMany({
    where: { organizationId: orgId, archivedAt: null },
    orderBy: { order: "asc" },
  });

  const index = stages.findIndex((s) => s.id === id);
  if (index < 0) redirectWithError("/configuracoes/pipeline", "not_found");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= stages.length) {
    redirectWithError("/configuracoes/pipeline", "error");
  }

  const current = stages[index];
  const swap = stages[swapIndex];

  await prisma.$transaction([
    prisma.pipelineStage.update({ where: { id: current.id }, data: { order: swap.order } }),
    prisma.pipelineStage.update({ where: { id: swap.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/configuracoes/pipeline");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/configuracoes/pipeline", "updated");
}

export async function archivePipelineStageAction(formData: FormData) {
  const session = await requireSession();
  await requirePermission(session, "pipeline:config", "/configuracoes/pipeline");

  const id = parseString(formData, "id");
  const targetStageId = parseString(formData, "targetStageId");
  const orgId = session.activeOrganizationId;

  const stage = await prisma.pipelineStage.findFirst({
    where: { id, organizationId: orgId, archivedAt: null },
    include: { _count: { select: { candidates: true } } },
  });
  if (!stage) redirectWithError("/configuracoes/pipeline", "not_found");

  if (stage._count.candidates > 0) {
    if (!targetStageId) {
      redirectWithError("/configuracoes/pipeline", "validation");
    }
    const target = await prisma.pipelineStage.findFirst({
      where: { id: targetStageId, organizationId: orgId, archivedAt: null },
    });
    if (!target || target.id === id) {
      redirectWithError("/configuracoes/pipeline", "not_found");
    }
    await prisma.candidate.updateMany({
      where: { stageId: id, organizationId: orgId },
      data: { stageId: targetStageId },
    });
  }

  const activeCount = await prisma.pipelineStage.count({
    where: { organizationId: orgId, archivedAt: null, id: { not: id } },
  });
  if (activeCount === 0) redirectWithError("/configuracoes/pipeline", "error");

  await prisma.pipelineStage.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/configuracoes/pipeline");
  revalidatePath("/recrutamento");
  redirectWithSuccess("/configuracoes/pipeline", "archived");
}
