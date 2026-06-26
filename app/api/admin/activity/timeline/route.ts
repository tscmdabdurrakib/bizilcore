import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { activityInclude, formatActivityLog } from "@/lib/activity/adminQueries";

function groupLabel(date: Date): string {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 7);

  if (date >= startToday) return "আজ";
  if (date >= startYesterday) return "গতকাল";
  if (date >= startWeek) return "এই সপ্তাহ";
  return date.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const userId = req.nextUrl.searchParams.get("userId");
  const shopId = req.nextUrl.searchParams.get("shopId");
  const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10) || 100);

  const logs = await prisma.userActivityLog.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(shopId ? { shopId } : {}),
    },
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const grouped: Record<string, ReturnType<typeof formatActivityLog>[]> = {};
  for (const log of logs) {
    const key = groupLabel(log.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(formatActivityLog(log));
  }

  return NextResponse.json({ grouped, total: logs.length });
}
