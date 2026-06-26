import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("cron");
  if ("error" in authResult) return authResult.error;

  const jobName = req.nextUrl.searchParams.get("jobName");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 200);

  const logs = await prisma.cronRunLog.findMany({
    where: jobName ? { jobName } : undefined,
    orderBy: { ranAt: "desc" },
    take: limit,
  });

  const jobSummary = await prisma.cronRunLog.groupBy({
    by: ["jobName"],
    _max: { ranAt: true },
    _count: { _all: true },
  });

  return NextResponse.json({ logs, jobSummary });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminRole("cron");
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const { jobName, result } = body;

  if (!jobName) return NextResponse.json({ error: "jobName required" }, { status: 400 });

  const log = await prisma.cronRunLog.create({
    data: {
      jobName,
      result: result ?? undefined,
      triggeredBy: authResult.user.id,
    },
  });

  await logAdminAction(authResult.user.id, "cron.run", "cron", jobName, { result });

  return NextResponse.json({ id: log.id, ranAt: log.ranAt });
}
