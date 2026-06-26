import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL!;
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 15 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  // Dev hot-reload can keep a stale client missing newly added models
  if (cached && "smsCreditGlobalSettings" in cached) return cached;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
