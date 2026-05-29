"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  login,
  requireSession,
  setSessionCookie,
  switchOrganization,
} from "@/lib/session";
import type { TaskStatus } from "@/generated/prisma/client";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const session = await login(email, password);
  if (!session) {
    redirect("/login?error=1");
  }

  await setSessionCookie(session);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  await switchOrganization(organizationId);
  revalidatePath("/", "layout");
}

export async function moveCandidateAction(formData: FormData) {
  const session = await requireSession();
  const candidateId = String(formData.get("candidateId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const declineReason = String(formData.get("declineReason") ?? "").trim();

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, organizationId: session.activeOrganizationId },
  });
  if (!stage) return;

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      stageId,
      declineReason:
        stage.terminalType === "DECLINED" ? declineReason || "Não informado" : null,
    },
  });

  revalidatePath("/recrutamento");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await requireSession();
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;

  await prisma.task.updateMany({
    where: { id: taskId, organizationId: session.activeOrganizationId },
    data: { status },
  });

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
}

export async function advanceOnboardingAction(formData: FormData) {
  const session = await requireSession();
  const onboardingId = String(formData.get("onboardingId") ?? "");

  const onboarding = await prisma.onboarding.findFirst({
    where: { id: onboardingId, organizationId: session.activeOrganizationId },
  });
  if (!onboarding) return;

  const nextStatus =
    onboarding.status === "STARTED"
      ? "DOCS_PENDING"
      : onboarding.status === "DOCS_PENDING"
        ? "SIGNATURE"
        : onboarding.status === "SIGNATURE"
          ? "COMPLETED"
          : "COMPLETED";

  await prisma.onboarding.update({
    where: { id: onboardingId },
    data: {
      status: nextStatus,
      signatureStatus:
        nextStatus === "COMPLETED" ? "SIGNED" : onboarding.signatureStatus,
    },
  });

  revalidatePath("/admissoes");
}

export async function sendToAutentiqueAction(formData: FormData) {
  const session = await requireSession();
  const onboardingId = String(formData.get("onboardingId") ?? "");

  await prisma.onboarding.updateMany({
    where: { id: onboardingId, organizationId: session.activeOrganizationId },
    data: { status: "SIGNATURE", signatureStatus: "PENDING" },
  });

  revalidatePath("/admissoes");
}
