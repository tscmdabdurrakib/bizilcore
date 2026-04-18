import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days  = parseInt(searchParams.get("days") ?? "0");
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const since = days > 0 ? (() => { const d = new Date(); d.setDate(d.getDate() - days); return d; })() : null;

  const transfers = await prisma.stockMovement.findMany({
    where: {
      userId: session.user.id,
      type:   "branch_transfer",
      ...(since ? { createdAt: { gte: since } } : {}),
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

  const enriched = filtered.map(t => {
    const reason    = t.reason ?? "";
    const toMatch   = reason.match(/^Transfer to: (.+?)(?:\s—|$)/);
    const noteMatch = reason.match(/—\s(.+)$/);
    return {
      id:          t.id,
      productId:   t.productId,
      productName: t.product?.name ?? "অজানা পণ্য",
      productSku:  t.product?.sku  ?? null,
      quantity:    Math.abs(t.quantity),
      branchName:  toMatch?.[1]?.trim()   ?? "অন্য শাখা",
      note:        noteMatch?.[1]?.trim() ?? null,
      createdAt:   t.createdAt,
    };
  });

  return NextResponse.json({ transfers: enriched, total: enriched.length });
}
