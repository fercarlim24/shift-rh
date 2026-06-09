import { describe, expect, it } from "vitest";

import { DEFAULT_PIPELINE_STAGES } from "@/lib/default-pipeline-stages";
import { canAccessAppRoute, canCreateOrganization, hasPermission } from "@/lib/rbac";

describe("organization creation", () => {
  it("SHIFT_ADMIN can create organization", () => {
    expect(canCreateOrganization("SHIFT_ADMIN")).toBe(true);
    expect(hasPermission("SHIFT_ADMIN", "org:write")).toBe(true);
    expect(canAccessAppRoute("SHIFT_ADMIN", "/clientes/novo")).toBe(true);
  });

  it("SHIFT_CONSULTANT cannot create organization", () => {
    expect(canCreateOrganization("SHIFT_CONSULTANT")).toBe(false);
    expect(hasPermission("SHIFT_CONSULTANT", "org:write")).toBe(false);
    expect(canAccessAppRoute("SHIFT_CONSULTANT", "/clientes/novo")).toBe(false);
  });

  it("CLIENT_VIEWER and COLLABORATOR cannot create organization", () => {
    for (const role of ["CLIENT_VIEWER", "COLLABORATOR"] as const) {
      expect(canCreateOrganization(role)).toBe(false);
      expect(canAccessAppRoute(role, "/clientes/novo")).toBe(false);
    }
  });

  it("new organization receives default pipeline stages", () => {
    expect(DEFAULT_PIPELINE_STAGES).toHaveLength(5);
    expect(DEFAULT_PIPELINE_STAGES.map((stage) => stage.name)).toEqual([
      "Triagem",
      "Entrevista",
      "Proposta",
      "Contratado",
      "Declinado",
    ]);
    expect(DEFAULT_PIPELINE_STAGES.filter((stage) => stage.isTerminal)).toHaveLength(2);
  });
});
