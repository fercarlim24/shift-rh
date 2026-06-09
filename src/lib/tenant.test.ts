import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/session", () => ({ requireSession: vi.fn() }));

import { scopedWhere } from "@/lib/tenant";
import type { Session } from "@/lib/session";

describe("scopedWhere", () => {
  const session: Session = {
    user: {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "SHIFT_ADMIN",
      organizationId: null,
    },
    activeOrganizationId: "org-landscape",
  };

  it("scopes queries to active organization", () => {
    expect(scopedWhere(session)).toEqual({ organizationId: "org-landscape" });
  });
});
