import { createHmac, timingSafeEqual } from "crypto";
import { getSessionSecret } from "@/lib/auth/session-secret";
import type { Session } from "@/lib/session";

export { getSessionSecret };

export function signSessionValue(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function parseSessionValue(raw: string): Session | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!parsed.user?.id || !parsed.activeOrganizationId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSignedSessionFormat(raw: string): boolean {
  return raw.includes(".") && !raw.startsWith("{");
}
