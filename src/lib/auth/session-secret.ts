export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET deve estar definido em produção (mín. 16 caracteres)");
  }
  return "dev-session-secret-shift-rh";
}
