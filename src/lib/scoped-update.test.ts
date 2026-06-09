import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    candidate: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { updateCandidateScoped } from "@/lib/scoped-update";

describe("scoped update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses update when record is outside organization", async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue(null);
    const result = await updateCandidateScoped("c1", "org-landscape", { name: "X" });
    expect(result.count).toBe(0);
    expect(prisma.candidate.update).not.toHaveBeenCalled();
  });

  it("updates when organization matches", async () => {
    vi.mocked(prisma.candidate.findFirst).mockResolvedValue({ id: "c1" } as never);
    vi.mocked(prisma.candidate.update).mockResolvedValue({} as never);
    const result = await updateCandidateScoped("c1", "org-landscape", { name: "X" });
    expect(result.count).toBe(1);
    expect(prisma.candidate.findFirst).toHaveBeenCalledWith({
      where: { id: "c1", organizationId: "org-landscape" },
    });
  });
});
