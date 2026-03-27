import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true, storeEnabled: true, storeVisits: true },
  });
  if (!shop || !shop.storeEnabled) {
    return NextResponse.json({ error: "Store not enabled" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30d";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const MAX_RANGE_DAYS = 366;
  const now = new Date();

  let startDate: Date;
  let endDate: Date;

  if (fromParam || toParam) {
    const parsedFrom = fromParam ? new Date(fromParam) : null;
    const parsedTo = toParam ? new Date(toParam) : new Date(now);

    if (parsedFrom && isNaN(parsedFrom.getTime())) {
      return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400 });
    }
    if (isNaN(parsedTo.getTime())) {
      return NextResponse.json({ error: "Invalid 'to' date" }, { status: 400 });
    }

    startDate = parsedFrom ?? new Date(now);
    startDate.setHours(0, 0, 0, 0);
    endDate = parsedTo;
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      return NextResponse.json({ error: "'from' must be before 'to'" }, { status: 400 });
    }
    const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
    if (rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json({ error: `Date range cannot exceed ${MAX_RANGE_DAYS} days` }, { status: 400 });
    }
  } else {
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    startDate = new Date(now);
    if (range === "7d") {
      startDate.setDate(now.getDate() - 6);
    } else {
      startDate.setDate(now.getDate() - 29);
    }
    startDate.setHours(0, 0, 0, 0);
  }

  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

  const [pageViews, storeOrders, topProductsRaw] = await Promise.all([
    prisma.storePageView.findMany({
      where: { shopId: shop.id, visitedAt: { gte: startDate, lte: endDate } },
      select: { visitedAt: true },
    }),
    prisma.storeOrder.findMany({
      where: {
        shopId: shop.id,
        status: { not: "cancelled" },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.storeOrderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        storeOrder: {
          shopId: shop.id,
          createdAt: { gte: startDate, lte: endDate },
          status: { not: "cancelled" },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalVisits = pageViews.length;
  const totalOrders = storeOrders.length;
  const totalRevenue = storeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

  const dailyMap = new Map<string, { visits: number; orders: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dailyMap.set(d.toISOString().split("T")[0], { visits: 0, orders: 0, revenue: 0 });
  }
  for (const v of pageViews) {
    const key = v.visitedAt.toISOString().split("T")[0];
    const entry = dailyMap.get(key);
    if (entry) entry.visits++;
  }
  for (const o of storeOrders) {
    const key = o.createdAt.toISOString().split("T")[0];
    const entry = dailyMap.get(key);
    if (entry) { entry.orders++; entry.revenue += o.totalAmount; }
  }

  const daily = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d }));

  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    name: p.productName,
    qty: p._sum.quantity ?? 0,
    revenue: p._sum.subtotal ?? 0,
  }));

  return NextResponse.json({
    totalVisits,
    totalOrders,
    totalRevenue,
    aov,
    conversionRate,
    daily,
    topProducts,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
}
