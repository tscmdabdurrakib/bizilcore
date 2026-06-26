import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET() {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const start = Date.now();
  let dbOk = false;
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbOk = true;
  } catch {
    dbLatency = Date.now() - start;
  }

  let smsBalance: number | null = null;
  try {
    const overview = await import("@/lib/sms/credits").then((m) => m.getAdminOverview());
    const bal = (overview as { platformBalance?: number | null | false }).platformBalance;
    smsBalance = typeof bal === "number" ? bal : null;
  } catch { /* optional */ }

  let lastCronRun: string | null = null;
  try {
    const log = await prisma.cronRunLog.findFirst({
      where: { jobName: "check-subscriptions" },
      orderBy: { ranAt: "desc" },
    });
    lastCronRun = log?.ranAt?.toISOString() ?? null;
  } catch { /* migration pending */ }

  return NextResponse.json({
    db: { ok: dbOk, latencyMs: dbLatency },
    sms: { platformBalance: smsBalance },
    cron: { lastRun: lastCronRun },
    timestamp: new Date().toISOString(),
  });
}
