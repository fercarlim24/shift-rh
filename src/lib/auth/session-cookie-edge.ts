import { getSessionSecret } from "@/lib/auth/session-secret";
import type { Session } from "@/lib/session";

function encodeSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(payload: string): string {
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacDigest(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeSecret(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function parseSessionValueEdge(raw: string): Promise<Session | null> {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!payload || !signature) return null;

  const expected = await hmacDigest(payload, getSessionSecret());
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as Session;
    if (!parsed.user?.id || !parsed.activeOrganizationId) return null;
    return parsed;
  } catch {
    return null;
  }
}
