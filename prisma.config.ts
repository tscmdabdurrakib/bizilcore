import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Load .env.local first (takes precedence), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/** Strip Supabase bracket-wrapped passwords, e.g. [myPass] → myPass */
function normalizeDbUrl(url: string): string {
  return url.replace(/:([^:@/]+)@/, (_m, pass) => `:${pass.replace(/^\[|\]$/g, "")}@`);
}

/** Migrations/db push need session/direct (5432), not transaction pooler (6543). */
function getDatasourceUrl(): string {
  const direct = process.env.SUPABASE_DIRECT_URL;
  if (direct) return normalizeDbUrl(direct);

  const pooled = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!pooled) throw new Error("Set SUPABASE_DATABASE_URL or DATABASE_URL");

  if (pooled.includes(":6543/")) {
    return normalizeDbUrl(pooled.replace(":6543/", ":5432/"));
  }
  return normalizeDbUrl(pooled);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatasourceUrl(),
  },
});
