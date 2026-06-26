import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const now = new Date();
  const sales = await prisma.flashSale.findMany({
    where: { shopId: shop.id, isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true, storeVisible: true,
            },
          },
        },
      },
    },
    orderBy: { endAt: "asc" },
  });

  return NextResponse.json(
    sales.map((s) => ({
      id: s.id,
      name: s.name,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      products: s.products
        .filter((p) => p.product.storeVisible)
        .map((p) => ({
          productId: p.product.id,
          name: p.product.name,
          originalPrice: p.product.sellPrice,
          salePrice: p.salePrice,
          imageUrl: p.product.imageUrl,
          stockQty: p.product.stockQty,
          maxQty: p.maxQty,
        })),
    })),
  );
}
