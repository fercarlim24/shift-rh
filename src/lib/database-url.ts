import path from "node:path";

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (url.startsWith("file:./")) {
    const relative = url.slice("file:".length);
    return `file:${path.join(process.cwd(), relative)}`;
  }

  return url;
}
