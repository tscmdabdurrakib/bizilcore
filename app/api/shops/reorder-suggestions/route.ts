import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import type { ReorderSuggestion } from "@/lib/shops/advanced";
import { shopApiError } from "@/lib/shops/api-error";

export type { ReorderSuggestion };

export async function GET(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branchId = new URL(req.url).searchParams.get("branchId");

  const branches = await prisma.shopBranch.findMany({
    where: {
      shopId: mainShop.id,
      isActive: true,
      ...(branchId ? { id: branchId } : {}),
    },
    select: { id: true, name: true },
  });

  if (branches.length === 0) return NextResponse.json({ suggestions: [] });

  const branchIds = branches.map(b => b.id);

  const [branchStocks, mainProducts] = await Promise.all([
    prisma.branchStock.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        product: { select: { id: true, name: true, sku: true, lowStockAt: true } },
        branch: { select: { id: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { shopId: mainShop.id },
      select: { id: true, stockQty: true, lowStockAt: true },
    }),
  ]);

  const mainMap = new Map(mainProducts.map(p => [p.id, p]));
  const suggestions: ReorderSuggestion[] = [];

  for (const row of branchStocks) {
    const threshold = row.product.lowStockAt;
    if (row.quantity > threshold) continue;

    const main = mainMap.get(row.productId);
    if (!main || main.stockQty <= 0) continue;

    const target = Math.max(threshold * 2, threshold + 1);
    const needed = target - row.quantity;
    const suggestedQty = Math.min(needed, main.stockQty);
    if (suggestedQty <= 0) continue;

    suggestions.push({
      branchId: row.branchId,
      branchName: row.branch.name,
      productId: row.productId,
      productName: row.product.name,
      sku: row.product.sku,
      branchQty: row.quantity,
      threshold,
      mainQty: main.stockQty,
      suggestedQty,
    });
  }

  suggestions.sort((a, b) => (a.branchQty / Math.max(a.threshold, 1)) - (b.branchQty / Math.max(b.threshold, 1)));

  return NextResponse.json({ suggestions: suggestions.slice(0, 50) });
  } catch (error) {
    return shopApiError(error, "shops/reorder-suggestions GET");
  }
}
