export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Veja .env.example ou docs/DEPLOY.md",
    );
  }

  return url;
}

export function getDirectDatabaseUrl() {
  return process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
}
