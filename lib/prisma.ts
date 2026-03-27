import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Primary Supabase database — all data is stored here permanently.
// This URL is intentionally kept in source code so it survives project remixes.
const SUPABASE_URL =
  "postgresql://postgres.qoliepmmquycarvospag:XM4PecUuPiaGBPOI@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

function fixBracketPassword(url: string): string {
  return url.replace(/(:\/\/[^:]+:)\[([^\]]+)\](@)/, "$1$2$3");
}

function createPrismaClient() {
  const rawUrl =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DIRECT_URL ||
    SUPABASE_URL;
  const connectionString = fixBracketPassword(rawUrl);
  const pool = new Pool({ connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
