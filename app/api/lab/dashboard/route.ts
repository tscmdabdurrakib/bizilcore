import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [todayOrders, samplePending, resultsReady, todayRevenue, todayQueue, homeCollections] = await Promise.all([
    prisma.testOrder.count({ where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.testOrder.count({ where: { shopId: shop.id, sampleCollected: false, status: { not: "delivered" } } }),
    prisma.testOrder.count({ where: { shopId: shop.id, status: "ready" } }),
    prisma.testOrder.aggregate({
      where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } },
      _sum: { paidAmount: true },
    }),
    prisma.testOrder.findMany({
      where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } },
      include: {
        patient: { select: { name: true, phone: true } },
        items: { include: { test: { select: { name: true, shortCode: true } } } },
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
    }),
    prisma.testOrder.findMany({
      where: {
        shopId: shop.id,
        collectionType: "home",
        homeTime: { gte: today, lt: tomorrow },
        status: { not: "delivered" },
      },
      include: {
        patient: { select: { name: true, phone: true } },
      },
      orderBy: { homeTime: "asc" },
    }),
  ]);

  return NextResponse.json({
    todayPatients: todayOrders,
    samplePending,
    resultsReady,
    todayRevenue: todayRevenue._sum.paidAmount ?? 0,
    todayQueue,
    homeCollections,
  });
}
