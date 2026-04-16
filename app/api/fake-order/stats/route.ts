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

  // Find phones reported by 2+ distinct shops globally (cross-store flagged phones)
  const phoneShopPairs = await prisma.fakeOrderReport.groupBy({
    by: ["phone", "shopId"],
  });
  const phoneToShops = new Map<string, Set<string>>();
  for (const row of phoneShopPairs) {
    if (!phoneToShops.has(row.phone)) phoneToShops.set(row.phone, new Set());
    phoneToShops.get(row.phone)!.add(row.shopId);
  }
  const crossStoreEncountered = [...phoneToShops.values()].filter(shops => shops.size >= 2).length;

  const [
    blacklistCount,
    fakeReportedTotal,
    blockedToday,
    flaggedThisMonth,
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
  ]);

  return NextResponse.json({
    blacklistCount,
    fakeReportedTotal,
    blockedToday,
    flaggedThisMonth,
    crossStoreEncountered,
  });
}
