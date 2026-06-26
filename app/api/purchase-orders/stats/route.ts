import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/purchase-orders/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalCount,
    draftCount,
    sentCount,
    partiallyReceivedCount,
    receivedCount,
    cancelledCount,
    receivedAgg,
    pendingAgg,
    overdueCount,
  ] = await Promise.all([
    prisma.purchaseOrder.count({ where: { shopId: shop.id } }),
    prisma.purchaseOrder.count({ where: { shopId: shop.id, status: "draft" } }),
    prisma.purchaseOrder.count({ where: { shopId: shop.id, status: "sent" } }),
    prisma.purchaseOrder.count({ where: { shopId: shop.id, status: "partially_received" } }),
    prisma.purchaseOrder.count({ where: { shopId: shop.id, status: "received" } }),
    prisma.purchaseOrder.count({ where: { shopId: shop.id, status: "cancelled" } }),
    prisma.purchaseOrder.aggregate({
      where: { shopId: shop.id, status: "received" },
      _sum: { total: true },
    }),
    prisma.purchaseOrder.aggregate({
      where: { shopId: shop.id, status: { in: ["sent", "partially_received"] } },
      _sum: { total: true },
    }),
    prisma.purchaseOrder.count({
      where: {
        shopId: shop.id,
        status: { in: ["sent", "partially_received"] },
        expectedDate: { lt: today },
      },
    }),
  ]);

  return NextResponse.json({
    totalCount,
    draftCount,
    sentCount,
    partiallyReceivedCount,
    receivedCount,
    cancelledCount,
    totalReceivedValue: receivedAgg._sum.total ?? 0,
    totalPendingValue: pendingAgg._sum.total ?? 0,
    overdueCount,
  });
}
