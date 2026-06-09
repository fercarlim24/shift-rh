import { describe, expect, it } from "vitest";

import {
  canAccessAppRoute,
  canCreateOrganization,
  hasPermission,
  navItemsForRole,
} from "@/lib/rbac";

describe("RBAC", () => {
  it("admin has user management permissions", () => {
    expect(hasPermission("SHIFT_ADMIN", "user:write")).toBe(true);
    expect(hasPermission("SHIFT_CONSULTANT", "user:write")).toBe(false);
  });

  it("collaborator is restricted to own modules", () => {
    expect(canAccessAppRoute("COLLABORATOR", "/vagas")).toBe(false);
    expect(canAccessAppRoute("COLLABORATOR", "/tarefas")).toBe(true);
    expect(canAccessAppRoute("COLLABORATOR", "/colaboradores/abc")).toBe(true);
  });

  it("only admin accesses /usuarios", () => {
    expect(canAccessAppRoute("SHIFT_ADMIN", "/usuarios")).toBe(true);
    expect(canAccessAppRoute("SHIFT_CONSULTANT", "/usuarios")).toBe(false);
    expect(canAccessAppRoute("CLIENT_VIEWER", "/usuarios/novo")).toBe(false);
  });

  it("only admin can create clients", () => {
    expect(canCreateOrganization("SHIFT_ADMIN")).toBe(true);
    expect(canCreateOrganization("SHIFT_CONSULTANT")).toBe(false);
    expect(canAccessAppRoute("SHIFT_ADMIN", "/clientes/novo")).toBe(true);
    expect(canAccessAppRoute("SHIFT_CONSULTANT", "/clientes/novo")).toBe(false);
  });

  it("filters nav items by role", () => {
    const collab = navItemsForRole("COLLABORATOR");
    expect(collab.map((i) => i.href)).toEqual(["/dashboard", "/tarefas", "/colaboradores"]);
    const admin = navItemsForRole("SHIFT_ADMIN");
    expect(admin.some((i) => i.href === "/usuarios")).toBe(true);
  });
});
