import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  isSignedSessionFormat,
  parseSessionValue,
  signSessionValue,
} from "../src/lib/auth/session-cookie";
import { verifyPassword } from "../src/lib/auth/password";
import { canAccessAppRoute, canCreateOrganization } from "../src/lib/rbac";
import { canAccessOrganization } from "../src/lib/permissions";
import { getDatabaseUrl } from "../src/lib/database-url";
import type { Session } from "../src/lib/session";

const prisma = new PrismaClient({ datasourceUrl: getDatabaseUrl() });

function sessionFor(
  user: {
    id: string;
    email: string;
    name: string;
    role: Session["user"]["role"];
    organizationId: string | null;
  },
  activeOrganizationId: string,
): Session {
  return { user, activeOrganizationId };
}

function checkSessionSecret(): string[] {
  const errors: string[] = [];
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 16)) {
    errors.push("SESSION_SECRET ausente ou curto em produção");
  }
  return errors;
}

function checkSignedCookies(): string[] {
  const errors: string[] = [];
  const sample: Session = {
    user: {
      id: "audit-user",
      email: "audit@shift.rh",
      name: "Audit",
      role: "SHIFT_ADMIN",
      organizationId: null,
    },
    activeOrganizationId: "org-audit",
  };

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    process.env.SESSION_SECRET = "audit-secret-min-16-chars";
  }

  const signed = signSessionValue(sample);
  if (!isSignedSessionFormat(signed)) errors.push("Cookie de sessão não está no formato assinado");
  if (!parseSessionValue(signed)) errors.push("Falha ao validar cookie assinado");
  if (parseSessionValue(JSON.stringify(sample))) {
    errors.push("Cookie JSON não assinado deveria ser rejeitado");
  }

  return errors;
}

function checkCriticalActions(): string[] {
  const errors: string[] = [];
  const root = join(process.cwd(), "src/app/actions");
  const checks: Record<string, string[]> = {
    "onboardings.ts": [
      "advanceOnboardingAction",
      "sendToAutentiqueAction",
      "redirectWithError",
      "requireOnboardingScoped",
    ],
    "candidates.ts": ["moveCandidateAction", "redirectWithError"],
  };

  for (const [file, tokens] of Object.entries(checks)) {
    const content = readFileSync(join(root, file), "utf8");
    for (const token of tokens) {
      if (!content.includes(token)) {
        errors.push(`Actions: ${file} não contém ${token}`);
      }
    }
  }

  const onboardings = readFileSync(join(root, "onboardings.ts"), "utf8");
  for (const fn of ["advanceOnboardingAction", "sendToAutentiqueAction"]) {
    const match = onboardings.match(new RegExp(`export async function ${fn}[\\s\\S]*?^}`, "m"));
    if (match && !match[0].includes("redirectWithError")) {
      errors.push(`${fn} pode falhar silenciosamente (sem redirectWithError)`);
    }
  }

  const candidates = readFileSync(join(root, "candidates.ts"), "utf8");
  const moveMatch = candidates.match(/export async function moveCandidateAction[\s\S]*?^}/m);
  if (moveMatch && !moveMatch[0].includes("redirectWithError")) {
    errors.push("moveCandidateAction pode falhar silenciosamente (sem redirectWithError)");
  }

  return errors;
}

async function main() {
  const errors: string[] = [
    ...checkSessionSecret(),
    ...checkSignedCookies(),
    ...checkCriticalActions(),
  ];

  const orgs = await prisma.organization.findMany({ where: { archivedAt: null } });
  const landscape = orgs.find((o) => o.tradeName === "LandscapeLABs");
  const acme = orgs.find((o) => o.tradeName === "Acme Tech");
  if (!landscape || !acme) errors.push("Seed: organizações demo não encontradas");

  const gestor = await prisma.user.findUnique({ where: { email: "gestor@landscape.to" } });
  const admin = await prisma.user.findUnique({ where: { email: "admin@shift.rh" } });
  const patricia = await prisma.user.findUnique({ where: { email: "patricia@shift.rh" } });
  const colaborador = await prisma.user.findUnique({ where: { email: "colaborador@landscape.to" } });
  if (!gestor || !admin || !patricia || !colaborador) {
    errors.push("Seed: usuários demo não encontrados");
  }

  if (gestor && !(await verifyPassword("demo123", gestor.password))) {
    errors.push("Seed: senha bcrypt do gestor inválida");
  }
  if (admin && !(await verifyPassword("demo123", admin.password))) {
    errors.push("Seed: senha bcrypt do admin inválida");
  }

  if (gestor && landscape && acme) {
    const gestorSession = sessionFor(gestor, landscape.id);
    const canLandscape = await canAccessOrganization(gestorSession, landscape.id);
    const canAcme = await canAccessOrganization(gestorSession, acme.id);
    if (!canLandscape) errors.push("RBAC: gestor deveria acessar Landscape");
    if (canAcme) errors.push("RBAC: gestor NÃO deveria acessar Acme");
  }

  if (admin && admin.role !== "SHIFT_ADMIN") {
    errors.push("Seed: admin@shift.rh deveria ser SHIFT_ADMIN");
  }

  if (patricia && patricia.role !== "SHIFT_CONSULTANT") {
    errors.push("Seed: patricia@shift.rh deveria ser SHIFT_CONSULTANT");
  }

  if (patricia) {
    if (canCreateOrganization(patricia.role)) {
      errors.push("RBAC: consultor NÃO deveria criar clientes");
    }
    if (canAccessAppRoute(patricia.role, "/clientes/novo")) {
      errors.push("RBAC: consultor NÃO deveria acessar /clientes/novo");
    }
  }

  if (patricia && landscape && acme) {
    const patriciaSession = sessionFor(patricia, landscape.id);
    const canLandscape = await canAccessOrganization(patriciaSession, landscape.id);
    const canAcme = await canAccessOrganization(patriciaSession, acme.id);
    if (!canLandscape) errors.push("RBAC: consultor deveria acessar Landscape (vínculo explícito)");
    if (canAcme) errors.push("RBAC: consultor NÃO deveria acessar Acme sem vínculo");
  }

  if (colaborador) {
    if (canAccessAppRoute("COLLABORATOR", "/vagas")) {
      errors.push("RBAC: colaborador não deveria acessar /vagas");
    }
    if (canAccessAppRoute("COLLABORATOR", "/usuarios")) {
      errors.push("RBAC: colaborador não deveria acessar /usuarios");
    }
    if (!canAccessAppRoute("COLLABORATOR", "/tarefas")) {
      errors.push("RBAC: colaborador deveria acessar /tarefas");
    }
  }

  if (landscape && acme) {
    const acmeJob = await prisma.jobOpening.findFirst({
      where: { organizationId: acme.id, archivedAt: null },
    });
    const landscapeScoped = await prisma.jobOpening.findFirst({
      where: { id: acmeJob?.id, organizationId: landscape.id },
    });
    if (acmeJob && landscapeScoped) {
      errors.push("Tenant: vaga Acme visível com filtro Landscape");
    }

    for (const org of [landscape, acme]) {
      const activeStages = await prisma.pipelineStage.count({
        where: { organizationId: org.id, archivedAt: null },
      });
      if (activeStages < 5) {
        errors.push(`Pipeline: org ${org.tradeName} com menos de 5 etapas ativas`);
      }
    }
  }

  const events = await prisma.onboardingEvent.count();
  if (events < 1) errors.push("Seed: eventos de admissão ausentes");

  if (errors.length) {
    console.error("AUDIT FALHOU:");
    errors.forEach((e) => console.error("  ✗", e));
    process.exit(1);
  }

  console.log("AUDIT OK:");
  console.log("  ✓ SESSION_SECRET e cookies assinados");
  console.log("  ✓ Seed e senhas bcrypt");
  console.log("  ✓ RBAC gestor, consultor e colaborador");
  console.log("  ✓ Queries tenant-scoped");
  console.log("  ✓ Pipeline por organização");
  console.log("  ✓ Actions críticas com feedback de erro");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
