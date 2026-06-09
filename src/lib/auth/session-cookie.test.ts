import { afterEach, describe, expect, it } from "vitest";
import {
  isSignedSessionFormat,
  parseSessionValue,
  signSessionValue,
} from "@/lib/auth/session-cookie";
import type { Session } from "@/lib/session";

const sample: Session = {
  user: {
    id: "user-1",
    email: "test@shift.rh",
    name: "Test",
    role: "SHIFT_ADMIN",
    organizationId: null,
  },
  activeOrganizationId: "org-1",
};

describe("session cookie signing", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("signs and parses a valid session", () => {
    process.env.SESSION_SECRET = "test-secret-with-16-chars-min";
    const signed = signSessionValue(sample);
    expect(isSignedSessionFormat(signed)).toBe(true);
    expect(parseSessionValue(signed)).toEqual(sample);
  });

  it("rejects tampered payload", () => {
    process.env.SESSION_SECRET = "test-secret-with-16-chars-min";
    const signed = signSessionValue(sample);
    const tampered = `${signed}x`;
    expect(parseSessionValue(tampered)).toBeNull();
  });

  it("rejects unsigned JSON cookie", () => {
    process.env.SESSION_SECRET = "test-secret-with-16-chars-min";
    const raw = JSON.stringify(sample);
    expect(isSignedSessionFormat(raw)).toBe(false);
    expect(parseSessionValue(raw)).toBeNull();
  });
});
