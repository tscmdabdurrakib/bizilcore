import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30") || 30));

  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      buyPrice: true,
      sellPrice: true,
      stockQty: true,
      lowStockAt: true,
      orderItems: {
        select: {
          quantity: true,
          unitPrice: true,
          subtotal: true,
          order: {
            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      },
      purchaseItems: {
        select: {
          productId: true,
          purchase: {
            select: {
              supplierId: true,
              supplier: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { purchase: { createdAt: "desc" } },
        take: 1,
      },
    },
  });

  const COUNTED = ["confirmed", "shipped", "delivered"];

  const result = products.map(p => {
    const soldItems = p.orderItems.filter(
      oi => COUNTED.includes(oi.order.status) && new Date(oi.order.createdAt) >= periodStart
    );
    const allTimeSold = p.orderItems.filter(oi => COUNTED.includes(oi.order.status));

    const unitsSold = soldItems.reduce((s, oi) => s + oi.quantity, 0);
    const revenue = soldItems.reduce((s, oi) => s + oi.subtotal, 0);
    const grossProfit = soldItems.reduce((s, oi) => s + (oi.unitPrice - p.buyPrice) * oi.quantity, 0);
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const weeklyVelocity = unitsSold / (days / 7);

    const daysRemaining =
      weeklyVelocity > 0
        ? Math.round((p.stockQty / weeklyVelocity) * 7)
        : null;

    const lastPurchaseItem = p.purchaseItems[0] ?? null;
    const supplierId = lastPurchaseItem?.purchase?.supplierId ?? null;
    const supplierName = lastPurchaseItem?.purchase?.supplier?.name ?? null;

    const totalUnitsSoldAllTime = allTimeSold.reduce((s, oi) => s + oi.quantity, 0);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stockQty: p.stockQty,
      currentStock: p.stockQty,
      lowStockAt: p.lowStockAt,
      unitsSold,
      revenue: Math.round(revenue),
      grossProfit: Math.round(grossProfit),
      margin: Math.round(margin * 10) / 10,
      weeklyVelocity: Math.round(weeklyVelocity * 10) / 10,
      daysRemaining,
      supplierId,
      supplierName,
      totalUnitsSoldAllTime,
    };
  });

  return NextResponse.json({ products: result, days, periodStart: periodStart.toISOString() });
}
