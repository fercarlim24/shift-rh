import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password bcrypt", () => {
  it("hashes and verifies demo password", async () => {
    const hash = await hashPassword("demo123");
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword("demo123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
