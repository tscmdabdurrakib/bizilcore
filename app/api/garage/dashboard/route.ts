import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayJobCards, readyJobCards, activeCount, todayJobs, recentJobs] = await Promise.all([
    prisma.jobCard.count({
      where: { shopId: shop.id, createdAt: { gte: today, lte: todayEnd } },
    }),
    prisma.jobCard.findMany({
      where: { shopId: shop.id, status: "ready" },
      include: { vehicle: { include: { customer: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.jobCard.count({
      where: {
        shopId: shop.id,
        status: { in: ["diagnosing", "repairing", "waiting_parts", "quality_check"] },
      },
    }),
    prisma.jobCard.findMany({
      where: { shopId: shop.id, createdAt: { gte: today, lte: todayEnd } },
      select: { advancePaid: true },
    }),
    prisma.jobCard.findMany({
      where: { shopId: shop.id },
      include: {
        vehicle: { select: { regNumber: true, type: true, brand: true, model: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const todayRevenue = todayJobs.reduce((sum, j) => sum + j.advancePaid, 0);

  const allProducts = await prisma.product.findMany({
    where: { shopId: shop.id },
    select: { stockQty: true, lowStockAt: true },
  });
  const lowStockParts = allProducts.filter(p => p.stockQty <= p.lowStockAt).length;

  return NextResponse.json({
    todayJobCards,
    readyCount: readyJobCards.length,
    activeCount,
    todayRevenue,
    readyVehicles: readyJobCards,
    recentJobs,
    lowStockParts,
  });
}
