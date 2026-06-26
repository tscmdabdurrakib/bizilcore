import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop, requireBusinessPlan, resolveActiveShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const COUNTED = ["confirmed", "shipped", "delivered"];

  const [
    branches,
    branchStocks,
    mainProducts,
    recentTransfers,
    weekTransfers,
    childShops,
    { accessibleShops },
    branchSalesAgg,
  ] = await Promise.all([
    prisma.shopBranch.findMany({
      where: { shopId: mainShop.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.branchStock.findMany({
      where: { branch: { shopId: mainShop.id }, quantity: { gt: 0 } },
      include: {
        product: { select: { name: true, sellPrice: true, lowStockAt: true, sku: true } },
        branch: { select: { id: true, name: true, isActive: true } },
      },
    }),
    prisma.product.findMany({
      where: { shopId: mainShop.id },
      select: { stockQty: true, sellPrice: true, lowStockAt: true, name: true, id: true },
    }),
    prisma.stockMovement.findMany({
      where: { userId: session.user.id, type: "branch_transfer", createdAt: { gte: weekAgo } },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.stockMovement.findMany({
      where: { userId: session.user.id, type: "branch_transfer", createdAt: { gte: weekAgo } },
      select: { branchId: true, fromBranchId: true, toBranchId: true },
    }),
    prisma.shop.findMany({
      where: { parentShopId: mainShop.id },
      select: { id: true, name: true, logoUrl: true },
    }),
    resolveActiveShop(session.user.id),
    prisma.shopBranch.findMany({ where: { shopId: mainShop.id }, select: { id: true } }).then(async (bs) =>
      bs.length === 0 ? [] : prisma.order.groupBy({
        by: ["branchId"],
        where: {
          userId: session.user.id,
          branchId: { in: bs.map(b => b.id) },
          status: { in: COUNTED },
          createdAt: { gte: weekAgo },
        },
        _count: true,
        _sum: { totalAmount: true },
      })
    ),
  ]);

  const salesMap = new Map(
    branchSalesAgg.map(a => [a.branchId, { count: a._count, revenue: a._sum.totalAmount ?? 0 }])
  );

  const mainStockQty = mainProducts.reduce((s, p) => s + p.stockQty, 0);
  const mainStockValue = mainProducts.reduce((s, p) => s + p.stockQty * p.sellPrice, 0);
  const mainLowStock = mainProducts.filter(p => p.stockQty > 0 && p.stockQty <= p.lowStockAt);

  const branchStats = branches.map(b => {
    const stocks = branchStocks.filter(s => s.branchId === b.id);
    const totalQty = stocks.reduce((s, r) => s + r.quantity, 0);
    const totalValue = stocks.reduce((s, r) => s + r.quantity * r.product.sellPrice, 0);
    const lowStock = stocks.filter(r => r.quantity <= r.product.lowStockAt);
    const transfers7d = weekTransfers.filter(t =>
      t.branchId === b.id || t.fromBranchId === b.id || t.toBranchId === b.id
    ).length;
    return {
      id: b.id,
      name: b.name,
      isActive: b.isActive,
      linkedShopId: b.linkedShopId,
      productCount: stocks.length,
      totalQty,
      totalValue,
      lowStockCount: lowStock.length,
      transfers7d,
      sales7d: salesMap.get(b.id)?.count ?? 0,
      revenue7d: salesMap.get(b.id)?.revenue ?? 0,
      topProducts: stocks
        .sort((a, c) => c.quantity - a.quantity)
        .slice(0, 3)
        .map(s => ({ name: s.product.name, qty: s.quantity })),
    };
  });

  const branchStockQty = branchStocks.reduce((s, r) => s + r.quantity, 0);
  const branchStockValue = branchStocks.reduce((s, r) => s + r.quantity * r.product.sellPrice, 0);

  const allLowStock = [
    ...mainLowStock.map(p => ({
      scope: "main" as const,
      branchName: mainShop.name,
      productName: p.name,
      quantity: p.stockQty,
      threshold: p.lowStockAt,
    })),
    ...branchStocks
      .filter(r => r.quantity <= r.product.lowStockAt)
      .map(r => ({
        scope: "branch" as const,
        branchId: r.branchId,
        branchName: r.branch.name,
        productName: r.product.name,
        quantity: r.quantity,
        threshold: r.product.lowStockAt,
      })),
  ].slice(0, 20);

  return NextResponse.json({
    org: {
      mainShopName: mainShop.name,
      totalLocations: 1 + branches.filter(b => b.isActive).length + childShops.length,
      childShopCount: childShops.length,
      accessibleShopCount: accessibleShops.length,
    },
    inventory: {
      mainStockQty,
      mainStockValue,
      branchStockQty,
      branchStockValue,
      combinedValue: mainStockValue + branchStockValue,
    },
    branches: branchStats,
    childShops,
    lowStockAlerts: allLowStock,
    recentTransfers: recentTransfers.map(t => ({
      id: t.id,
      productName: t.product?.name ?? "—",
      quantity: Math.abs(t.quantity),
      direction: t.direction,
      createdAt: t.createdAt.toISOString(),
    })),
  });
  } catch (error) {
    return shopApiError(error, "shops/overview GET");
  }
}
