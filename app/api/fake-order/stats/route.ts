import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    blacklistCount,
    fakeReportedTotal,
    blockedToday,
    flaggedThisMonth,
    crossStoreEncountered,
  ] = await Promise.all([
    prisma.phoneBlacklist.count({ where: { shopId: shop.id } }),
    prisma.order.count({ where: { userId: session.user.id, fakeReported: true } }),
    prisma.order.count({
      where: {
        userId: session.user.id,
        riskScore: { gte: 80 },
        createdAt: { gte: todayStart },
      },
    }),
    prisma.order.count({
      where: {
        userId: session.user.id,
        riskScore: { gte: 20 },
        createdAt: { gte: monthStart },
      },
    }),
    prisma.fakeOrderReport.groupBy({
      by: ["phone"],
      where: { shopId: shop.id },
    }).then(r => r.length),
  ]);

  return NextResponse.json({
    blacklistCount,
    fakeReportedTotal,
    blockedToday,
    flaggedThisMonth,
    crossStoreEncountered,
  });
}
