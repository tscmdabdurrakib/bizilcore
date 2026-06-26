import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

  let lastCronRun: { ranAt: Date } | null = null;

  const [
    totalUsers,
    totalShops,
    totalOrders,
    totalRevenue,
    planCounts,
    recentShops,
    pendingPaymentsCount,
    signupsToday,
    signupsThisWeek,
    signupsPrevWeek,
    recentUsers,
    topShopsRaw,
    pendingPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.order.count(),
    prisma.payment.aggregate({
      where: { status: { in: ["completed", "approved"] } },
      _sum: { amount: true },
    }),
    prisma.subscription.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.shop.findMany({
      orderBy: { id: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true, subscription: true } },
        _count: { select: { products: true, customers: true, staffMembers: true } },
      },
    }),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfPrevWeek, lt: startOfWeek } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: { select: { plan: true } },
      },
    }),
    prisma.$queryRaw<{ id: string; name: string; orderCount: bigint }[]>`
      SELECT s.id, s.name, COUNT(o.id)::bigint AS "orderCount"
      FROM "Shop" s
      LEFT JOIN "Order" o ON o."userId" = s."userId"
      GROUP BY s.id, s.name
      ORDER BY "orderCount" DESC
      LIMIT 5
    `,
    prisma.payment.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscription: { select: { plan: true, status: true, endDate: true } },
          },
        },
      },
    }),
  ]);

  const topShopsByOrders = topShopsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    orderCount: Number(s.orderCount),
  }));

  try {
    lastCronRun = await prisma.cronRunLog.findFirst({
      where: { jobName: "check-subscriptions" },
      orderBy: { ranAt: "desc" },
    });
  } catch { /* migration pending */ }

  let activeShops = 0;
  let inactiveShops = 0;
  try {
    [activeShops, inactiveShops] = await Promise.all([
      prisma.shop.count({ where: { shopStatus: "active", storeEnabled: true } }),
      prisma.shop.count({ where: { OR: [{ shopStatus: { not: "active" } }, { storeEnabled: false }] } }),
    ]);
  } catch {
    activeShops = await prisma.shop.count({ where: { storeEnabled: true } });
    inactiveShops = totalShops - activeShops;
  }

  return NextResponse.json({
    totalUsers,
    totalShops,
    totalOrders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    planCounts,
    recentShops,
    pendingPaymentsCount,
    signupsToday,
    signupsThisWeek,
    userTrendWeek: signupsThisWeek - signupsPrevWeek,
    recentUsers,
    topShopsByOrders,
    activeShops,
    inactiveShops,
    lastCronRun: lastCronRun?.ranAt?.toISOString() ?? null,
    pendingPaymentsPreview: pendingPayments,
  });
}
