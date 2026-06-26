import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const alerts: {
    id: string;
    type: string;
    severity: "warning" | "danger";
    title: string;
    detail: string;
    userId?: string;
    shopId?: string | null;
  }[] = [];

  // Same user, 2+ IPs within 1 hour
  const ipGroups = await prisma.userActivityLog.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: oneHourAgo },
      actionType: { in: ["login", "page_view"] },
      ipAddress: { not: null },
    },
    _count: { ipAddress: true },
  });

  for (const g of ipGroups) {
    const distinctIps = await prisma.userActivityLog.findMany({
      where: {
        userId: g.userId,
        createdAt: { gte: oneHourAgo },
        actionType: { in: ["login", "page_view"] },
        ipAddress: { not: null },
      },
      select: { ipAddress: true },
      distinct: ["ipAddress"],
    });
    if (distinctIps.length >= 2) {
      const user = await prisma.user.findUnique({
        where: { id: g.userId },
        select: { name: true, email: true },
      });
      alerts.push({
        id: `multi-ip-${g.userId}`,
        type: "multi_ip",
        severity: "warning",
        title: "একই user বিভিন্ন IP থেকে",
        detail: `${user?.name ?? user?.email ?? g.userId} — ${distinctIps.length}টি IP (১ ঘণ্টার মধ্যে)`,
        userId: g.userId,
      });
    }
  }

  // Bot-like page views (>50 in 10 min)
  const pageViewGroups = await prisma.userActivityLog.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: tenMinAgo },
      actionType: "page_view",
    },
    _count: { id: true },
    having: { id: { _count: { gt: 50 } } },
  });

  for (const g of pageViewGroups) {
    const user = await prisma.user.findUnique({
      where: { id: g.userId },
      select: { name: true, email: true },
    });
    alerts.push({
      id: `bot-${g.userId}`,
      type: "bot_like",
      severity: "danger",
      title: "অস্বাভাবিক page view",
      detail: `${user?.name ?? user?.email ?? g.userId} — ${g._count.id} page views (১০ মিনিটে)`,
      userId: g.userId,
    });
  }

  // Repeated errors (5+ same page in 30 min)
  const errorGroups = await prisma.userActivityLog.groupBy({
    by: ["userId", "pagePath"],
    where: {
      createdAt: { gte: thirtyMinAgo },
      actionType: "error",
      pagePath: { not: null },
    },
    _count: { id: true },
    having: { id: { _count: { gte: 5 } } },
  });

  for (const g of errorGroups) {
    const user = await prisma.user.findUnique({
      where: { id: g.userId },
      select: { name: true, email: true },
    });
    alerts.push({
      id: `errors-${g.userId}-${g.pagePath}`,
      type: "repeated_errors",
      severity: "danger",
      title: "বারবার error",
      detail: `${user?.name ?? g.userId} — ${g.pagePath} (${g._count.id} বার)`,
      userId: g.userId,
    });
  }

  return NextResponse.json({ alerts });
}
