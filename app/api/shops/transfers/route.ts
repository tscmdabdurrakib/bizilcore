import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function GET(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "0");
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const branchId = searchParams.get("branchId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const since = days > 0 ? (() => { const d = new Date(); d.setDate(d.getDate() - days); return d; })() : null;

  const mainShop = await getPrimaryShop(session.user.id);

  const transfers = await prisma.stockMovement.findMany({
    where: {
      userId: session.user.id,
      type: "branch_transfer",
      ...(since ? { createdAt: { gte: since } } : {}),
      ...(branchId ? { branchId } : {}),
    },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const filtered = search
    ? transfers.filter(t =>
        (t.product?.name ?? "").toLowerCase().includes(search) ||
        (t.reason ?? "").toLowerCase().includes(search)
      )
    : transfers;

  const branchNames = new Map<string, string>();
  if (mainShop) {
    const branches = await prisma.shopBranch.findMany({
      where: { shopId: mainShop.id },
      select: { id: true, name: true },
    });
    for (const b of branches) branchNames.set(b.id, b.name);
  }

  const enriched = filtered.map(t => {
    const reason = t.reason ?? "";
    const toMatch = reason.match(/^Transfer to: (.+?)(?:\s—|$)/);
    const fromMatch = reason.match(/^Transfer from: (.+?)(?:\s—|$)/);
    const noteMatch = reason.match(/—\s(.+)$/);
    const resolvedBranchId = t.branchId ?? t.toBranchId ?? t.fromBranchId;
    const branchName =
      (resolvedBranchId ? branchNames.get(resolvedBranchId) : null) ??
      toMatch?.[1]?.trim() ??
      fromMatch?.[1]?.trim() ??
      "অন্য শাখা";

    return {
      id: t.id,
      productId: t.productId,
      productName: t.product?.name ?? "অজানা পণ্য",
      productSku: t.product?.sku ?? null,
      quantity: Math.abs(t.quantity),
      branchName,
      branchId: resolvedBranchId,
      note: noteMatch?.[1]?.trim() ?? (t.direction && noteMatch ? null : null),
      direction: t.direction ?? (fromMatch ? "branch_to_main" : "main_to_branch"),
      createdAt: t.createdAt,
    };
  });

  return NextResponse.json({ transfers: enriched, total: enriched.length });
  } catch (error) {
    return shopApiError(error, "shops/transfers GET");
  }
}
