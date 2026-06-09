import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobOpening: { findFirst: vi.fn() },
    candidate: { findFirst: vi.fn() },
    pipelineStage: { findFirst: vi.fn() },
    onboarding: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  validateCandidateInOrg,
  validateJobInOrg,
  validateStageInOrg,
} from "@/lib/validate-relations";

describe("FK tenant validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects job from another org", async () => {
    vi.mocked(prisma.jobOpening.findFirst).mockResolvedValue(null);
    expect(await validateJobInOrg("job-acme", "org-landscape")).toBe(false);
    expect(prisma.jobOpening.findFirst).toHaveBeenCalledWith({
      where: { id: "job-acme", organizationId: "org-landscape", archivedAt: null },
    });
  });

  it("accepts null optional FK", async () => {
    expect(await validateCandidateInOrg(null, "org-1")).toBe(true);
    expect(prisma.candidate.findFirst).not.toHaveBeenCalled();
  });

  it("validates stage belongs to org and is active", async () => {
    vi.mocked(prisma.pipelineStage.findFirst).mockResolvedValue({ id: "s1" } as never);
    expect(await validateStageInOrg("s1", "org-1")).toBe(true);
    expect(prisma.pipelineStage.findFirst).toHaveBeenCalledWith({
      where: { id: "s1", organizationId: "org-1", archivedAt: null },
    });
  });
});
