import type {
  EmploymentType,
  JobStatus,
  OnboardingStatus,
  SignatureStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@/generated/prisma/client";

export const jobStatusLabel: Record<JobStatus, string> = {
  OPEN: "Aberta",
  PAUSED: "Pausada",
  CLOSED: "Fechada",
};

export const employmentTypeLabel: Record<EmploymentType, string> = {
  CLT: "CLT",
  PJ: "PJ",
  BOTH: "CLT ou PJ",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const onboardingStatusLabel: Record<OnboardingStatus, string> = {
  STARTED: "Iniciada",
  DOCS_PENDING: "Docs pendentes",
  SIGNATURE: "Assinatura",
  COMPLETED: "Concluída",
};

export const signatureStatusLabel: Record<SignatureStatus, string> = {
  PENDING: "Pendente",
  SIGNED: "Assinado",
  REJECTED: "Recusado",
};

export const roleLabel: Record<UserRole, string> = {
  SHIFT_ADMIN: "Admin Shift",
  SHIFT_CONSULTANT: "Consultor",
  CLIENT_VIEWER: "Cliente (leitura)",
};

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}
