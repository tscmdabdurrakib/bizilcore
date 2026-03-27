import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const rows = body.rows as {
    name: string;
    buyPrice: string;
    sellPrice: string;
    stockQty: string;
    category: string;
    sku?: string;
  }[];

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const valid = rows.filter((r) => r.name?.trim());

  const products = await prisma.$transaction(
    valid.map((r) =>
      prisma.product.create({
        data: {
          name: r.name.trim(),
          buyPrice: parseFloat(r.buyPrice) || 0,
          sellPrice: parseFloat(r.sellPrice) || 0,
          stockQty: parseInt(r.stockQty) || 0,
          category: r.category?.trim() || null,
          sku: r.sku?.trim() || null,
          shopId: shop.id,
        },
      })
    )
  );

  return NextResponse.json({ count: products.length });
}
