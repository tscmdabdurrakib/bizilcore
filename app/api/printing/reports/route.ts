import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); thirtyDaysAgo.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [
    monthOrders,
    monthRevenue,
    totalDue,
    byStatus,
    topServices,
    dailyRows,
  ] = await Promise.all([
    prisma.printOrder.count({ where: { shopId: shop.id, createdAt: { gte: monthStart } } }),
    prisma.printPayment.aggregate({
      where: { order: { shopId: shop.id }, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.printOrder.aggregate({
      where: { shopId: shop.id, status: { not: "delivered" } },
      _sum: { dueAmount: true },
    }),
    prisma.printOrder.groupBy({
      by: ["status"],
      where: { shopId: shop.id },
      _count: true,
    }),
    prisma.printOrderItem.groupBy({
      by: ["itemName"],
      where: { order: { shopId: shop.id, createdAt: { gte: monthStart } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<{ day: string; revenue: number; orders: bigint }[]>`
      SELECT
        TO_CHAR(po."createdAt", 'MM/DD') AS day,
        COALESCE(SUM(pp.amount), 0) AS revenue,
        COUNT(DISTINCT po.id) AS orders
      FROM "PrintOrder" po
      LEFT JOIN "PrintPayment" pp ON pp."orderId" = po.id
      WHERE po."shopId" = ${shop.id}
        AND po."createdAt" >= ${thirtyDaysAgo}
      GROUP BY TO_CHAR(po."createdAt", 'MM/DD'), DATE_TRUNC('day', po."createdAt")
      ORDER BY DATE_TRUNC('day', po."createdAt")
    `,
  ]);

  return NextResponse.json({
    monthOrders,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    totalDue: totalDue._sum.dueAmount ?? 0,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    topServices: topServices.map(s => ({
      name: s.itemName,
      qty: s._sum.quantity ?? 0,
      revenue: s._sum.subtotal ?? 0,
    })),
    dailyChart: dailyRows.map(r => ({
      day: r.day,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
  });
}
