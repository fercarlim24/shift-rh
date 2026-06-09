import type { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "org:read"
  | "org:write"
  | "org:archive"
  | "job:read"
  | "job:write"
  | "job:archive"
  | "candidate:read"
  | "candidate:write"
  | "candidate:archive"
  | "task:read"
  | "task:write"
  | "task:archive"
  | "onboarding:read"
  | "onboarding:write"
  | "onboarding:archive"
  | "employee:read"
  | "employee:write"
  | "employee:archive"
  | "pipeline:move"
  | "pipeline:config"
  | "user:read"
  | "user:write"
  | "user:archive"
  | "user:access";

const rolePermissions: Record<UserRole, Permission[]> = {
  SHIFT_ADMIN: [
    "org:read",
    "org:write",
    "org:archive",
    "job:read",
    "job:write",
    "job:archive",
    "candidate:read",
    "candidate:write",
    "candidate:archive",
    "task:read",
    "task:write",
    "task:archive",
    "onboarding:read",
    "onboarding:write",
    "onboarding:archive",
    "employee:read",
    "employee:write",
    "employee:archive",
    "pipeline:move",
    "pipeline:config",
    "user:read",
    "user:write",
    "user:archive",
    "user:access",
  ],
  SHIFT_CONSULTANT: [
    "org:read",
    "job:read",
    "job:write",
    "job:archive",
    "candidate:read",
    "candidate:write",
    "candidate:archive",
    "task:read",
    "task:write",
    "task:archive",
    "onboarding:read",
    "onboarding:write",
    "onboarding:archive",
    "employee:read",
    "employee:write",
    "pipeline:move",
    "pipeline:config",
  ],
  CLIENT_VIEWER: [
    "org:read",
    "job:read",
    "candidate:read",
    "task:read",
    "onboarding:read",
    "employee:read",
  ],
  COLLABORATOR: ["task:read", "employee:read"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canViewAllOrganizations(role: UserRole): boolean {
  return role === "SHIFT_ADMIN" || role === "SHIFT_CONSULTANT";
}

export function canCreateOrganization(role: UserRole): boolean {
  return role === "SHIFT_ADMIN";
}

const collaboratorRoutes = ["/dashboard", "/tarefas", "/colaboradores"];
const adminOnlyRoutes = ["/usuarios", "/clientes/novo"];

export function canAccessAppRoute(role: UserRole, pathname: string): boolean {
  if (adminOnlyRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return role === "SHIFT_ADMIN";
  }

  if (pathname.startsWith("/configuracoes")) {
    return role === "SHIFT_ADMIN" || role === "SHIFT_CONSULTANT";
  }

  if (role === "SHIFT_ADMIN" || role === "SHIFT_CONSULTANT" || role === "CLIENT_VIEWER") {
    return true;
  }

  if (role === "COLLABORATOR") {
    return collaboratorRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }

  return false;
}

export function navItemsForRole(role: UserRole) {
  const all = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clientes", label: "Clientes" },
    { href: "/vagas", label: "Vagas" },
    { href: "/candidatos", label: "Candidatos" },
    { href: "/recrutamento", label: "R&S" },
    { href: "/tarefas", label: "Tarefas" },
    { href: "/admissoes", label: "Admissões" },
    { href: "/colaboradores", label: "Colaboradores" },
    { href: "/configuracoes/pipeline", label: "Pipeline" },
    { href: "/usuarios", label: "Usuários" },
  ];

  if (role === "COLLABORATOR") {
    return all.filter((item) => collaboratorRoutes.includes(item.href));
  }

  if (role === "CLIENT_VIEWER") {
    return all.filter((item) => !["/clientes", "/usuarios", "/configuracoes/pipeline"].includes(item.href));
  }

  if (role === "SHIFT_CONSULTANT") {
    return all.filter((item) => item.href !== "/usuarios");
  }

  return all;
}
