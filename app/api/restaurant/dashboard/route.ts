import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [
    todaySalesAgg,
    activeTables,
    pendingOrders,
    allMaterials,
    hourlyOrdersRaw,
    recentOrders,
  ] = await Promise.all([
    prisma.restaurantOrder.aggregate({
      where: { shopId: shop.id, status: "paid", createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.diningTable.count({
      where: { shopId: shop.id, status: "occupied" },
    }),
    prisma.restaurantOrder.count({
      where: { shopId: shop.id, status: { in: ["pending", "preparing", "ready"] } },
    }),
    prisma.rawMaterial.findMany({
      where: { shopId: shop.id },
      select: { id: true, name: true, currentStock: true, reorderLevel: true, unit: true },
      orderBy: { currentStock: "asc" },
    }),
    prisma.restaurantOrder.findMany({
      where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.restaurantOrder.findMany({
      where: { shopId: shop.id, status: { in: ["pending", "preparing", "ready", "served"] } },
      include: {
        items: { include: { menuItem: { select: { name: true } } }, take: 3 },
        table: { select: { number: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const lowStockList = allMaterials.filter(m => m.currentStock <= m.reorderLevel);
  const lowStockCount = lowStockList.length;

  const hourlyMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) hourlyMap.set(h, 0);
  for (const o of hourlyOrdersRaw) {
    const h = new Date(o.createdAt).getHours();
    hourlyMap.set(h, (hourlyMap.get(h) ?? 0) + 1);
  }
  const hourlyChart = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count }));

  return NextResponse.json({
    todaySales: todaySalesAgg._sum.totalAmount ?? 0,
    todayOrderCount: todaySalesAgg._count,
    activeTables,
    pendingOrders,
    lowStockCount,
    hourlyChart,
    recentOrders,
    lowStockMaterials: lowStockList.filter(m => m.currentStock <= m.reorderLevel),
  });
}
