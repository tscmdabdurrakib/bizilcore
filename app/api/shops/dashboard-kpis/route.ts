import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";
import { withTiming } from "@/lib/perf";
import { cachedFetch } from "@/lib/redis-cache";
import { CK, TTL } from "@/lib/cache";

const COUNTED = ["confirmed", "shipped", "delivered"];

export async function GET() {
  return withTiming("shops/dashboard-kpis", async () => {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ locked: true, branches: [] });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ branches: [] });

  const cacheKey = `${CK.dashboard(mainShop.id)}:branch-kpis`;
  const payload = await cachedFetch(cacheKey, TTL.ORDERS, async () => {

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const branches = await prisma.shopBranch.findMany({
    where: { shopId: mainShop.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (branches.length === 0) {
    return {
      branchCount: 0,
      todayBranchRevenue: 0,
      todayBranchOrders: 0,
      weekBranchRevenue: 0,
      lowStockBranchCount: 0,
      branches: [],
    };
  }

  const branchIds = branches.map(b => b.id);

  const [todayAgg, weekAgg, lowStockRows, perBranchWeek] = await Promise.all([
    prisma.order.aggregate({
      where: {
        userId: session.user.id,
        branchId: { in: branchIds },
        createdAt: { gte: today, lt: tomorrow },
        status: { in: COUNTED },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        userId: session.user.id,
        branchId: { in: branchIds },
        createdAt: { gte: weekAgo },
        status: { in: COUNTED },
      },
      _sum: { totalAmount: true },
    }),
    prisma.branchStock.findMany({
      where: { branchId: { in: branchIds } },
      include: { product: { select: { lowStockAt: true } } },
    }),
    prisma.order.groupBy({
      by: ["branchId"],
      where: {
        userId: session.user.id,
        branchId: { in: branchIds },
        createdAt: { gte: weekAgo },
        status: { in: COUNTED },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const lowStockByBranch = new Set<string>();
  for (const row of lowStockRows) {
    if (row.quantity <= row.product.lowStockAt) lowStockByBranch.add(row.branchId);
  }

  const weekMap = new Map(perBranchWeek.map(r => [r.branchId, { revenue: r._sum.totalAmount ?? 0, orders: r._count }]));

  return {
    branchCount: branches.length,
    todayBranchRevenue: todayAgg._sum.totalAmount ?? 0,
    todayBranchOrders: todayAgg._count,
    weekBranchRevenue: weekAgg._sum.totalAmount ?? 0,
    lowStockBranchCount: lowStockByBranch.size,
    branches: branches.map(b => ({
      id: b.id,
      name: b.name,
      weekRevenue: weekMap.get(b.id)?.revenue ?? 0,
      weekOrders: weekMap.get(b.id)?.orders ?? 0,
    })).sort((a, c) => c.weekRevenue - a.weekRevenue),
  };
  });

  return NextResponse.json(payload);
  } catch (error) {
    return shopApiError(error, "shops/dashboard-kpis GET");
  }
  });
}
