// Prisma config — migrations usam DIRECT_URL (ou DATABASE_URL) quando definidas.
// Durante `prisma generate` (ex.: install) não exige banco real.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: directUrl,
  },
});
