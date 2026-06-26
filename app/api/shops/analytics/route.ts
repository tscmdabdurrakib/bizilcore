import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const [branches, transfers, mainStockAgg, branchStockAgg] = await Promise.all([
    prisma.shopBranch.findMany({ where: { shopId: mainShop.id, isActive: true }, select: { id: true, name: true } }),
    prisma.stockMovement.findMany({
      where: { userId: session.user.id, type: "branch_transfer" },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.product.aggregate({ where: { shopId: mainShop.id }, _sum: { stockQty: true } }),
    prisma.branchStock.aggregate({
      where: { branch: { shopId: mainShop.id } },
      _sum: { quantity: true },
    }),
  ]);

  const branchNameMap = new Map(branches.map(b => [b.id, b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name]));

  const branchTransferCounts = new Map<string, number>();
  const productMap: Record<string, number> = {};
  let totalTransferred = 0;

  for (const t of transfers) {
    const qty = Math.abs(t.quantity);
    totalTransferred += qty;
    const bid = t.branchId ?? t.toBranchId ?? t.fromBranchId;
    if (bid) branchTransferCounts.set(bid, (branchTransferCounts.get(bid) ?? 0) + qty);
    const pname = t.product?.name ?? "Unknown";
    productMap[pname] = (productMap[pname] ?? 0) + qty;
  }

  const branchStockByBranch = await prisma.branchStock.groupBy({
    by: ["branchId"],
    where: { branch: { shopId: mainShop.id } },
    _sum: { quantity: true },
  });
  const stockByBranch = new Map(branchStockByBranch.map(r => [r.branchId, r._sum.quantity ?? 0]));

  const now = Date.now();
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const total = transfers
      .filter(t => {
        const td = new Date(t.createdAt);
        return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + Math.abs(t.quantity), 0);
    return { label, total };
  });

  const byBranch = branches.map(b => ({
    name: branchNameMap.get(b.id) ?? b.name,
    count: branchTransferCounts.get(b.id) ?? 0,
    stockQty: stockByBranch.get(b.id) ?? 0,
  })).sort((a, b) => b.count - a.count);

  const topProducts = Object.entries(productMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, qty]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, qty }));

  return NextResponse.json({
    summary: {
      totalTransferred,
      transferCount: transfers.length,
      activeBranches: branches.length,
      uniqueProducts: Object.keys(productMap).length,
      mainStockQty: mainStockAgg._sum.stockQty ?? 0,
      branchStockQty: branchStockAgg._sum.quantity ?? 0,
    },
    daily,
    byBranch,
    topProducts,
  });
  } catch (error) {
    return shopApiError(error, "shops/analytics GET");
  }
}
