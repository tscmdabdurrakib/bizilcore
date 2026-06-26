import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function GET(req: NextRequest, { params }: { params: Promise<{ branchId: string }> }) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branchId } = await params;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branch = await prisma.shopBranch.findFirst({
    where: { id: branchId, shopId: mainShop.id },
  });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const rows = await prisma.branchStock.findMany({
    where: {
      branchId,
      quantity: { gt: 0 },
      ...(search ? { product: { name: { contains: search, mode: "insensitive" } } } : {}),
    },
    include: {
      product: { select: { name: true, sku: true, sellPrice: true, lowStockAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const lastTransfers = await prisma.stockMovement.findMany({
    where: { branchId, type: "branch_transfer" },
    select: { productId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const lastTransferMap = new Map<string, Date>();
  for (const t of lastTransfers) {
    if (!lastTransferMap.has(t.productId)) lastTransferMap.set(t.productId, t.createdAt);
  }

  const stock = rows.map(r => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    sku: r.product.sku,
    quantity: r.quantity,
    sellPrice: r.product.sellPrice,
    lowStockAt: r.product.lowStockAt,
    lastTransferAt: lastTransferMap.get(r.productId)?.toISOString() ?? null,
  }));

  const totals = {
    productCount: stock.length,
    totalQty: stock.reduce((s, r) => s + r.quantity, 0),
    totalValue: stock.reduce((s, r) => s + r.quantity * r.sellPrice, 0),
    lowStockCount: stock.filter(r => r.quantity <= r.lowStockAt).length,
  };

  return NextResponse.json({ stock, totals, branch: { id: branch.id, name: branch.name } });
  } catch (error) {
    return shopApiError(error, "shops/[branchId]/stock GET");
  }
}
