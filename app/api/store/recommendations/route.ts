import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const productId = url.searchParams.get("productId");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  if (productId) {
    const manual = await prisma.productRelation.findMany({
      where: { productId },
      include: {
        relatedProduct: {
          select: {
            id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true,
            hasVariants: true, storeFeatured: true, storeVisible: true,
          },
        },
      },
      take: 6,
    });
    const manualProducts = manual.map((r) => r.relatedProduct).filter((p) => p.storeVisible);

    if (manualProducts.length >= 3) {
      return NextResponse.json({ products: manualProducts });
    }

    const source = await prisma.product.findFirst({
      where: { id: productId, shopId: shop.id },
      select: { category: true },
    });

    const coPurchase = source?.category
      ? await prisma.product.findMany({
          where: {
            shopId: shop.id,
            storeVisible: true,
            category: source.category,
            id: { not: productId },
          },
          select: {
            id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true,
            hasVariants: true, storeFeatured: true, storeVisible: true,
          },
          take: 6,
          orderBy: { storeFeatured: "desc" },
        })
      : [];

    return NextResponse.json({ products: manualProducts.length ? manualProducts : coPurchase });
  }

  const topProducts = await prisma.storeOrderItem.groupBy({
    by: ["productId"],
    where: { storeOrder: { shopId: shop.id }, productId: { not: null } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });

  const ids = topProducts.map((p) => p.productId!).filter(Boolean);
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids }, storeVisible: true },
        select: {
          id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true,
          hasVariants: true, storeFeatured: true, storeVisible: true,
        },
      })
    : await prisma.product.findMany({
        where: { shopId: shop.id, storeVisible: true, storeFeatured: true },
        select: {
          id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true,
          hasVariants: true, storeFeatured: true, storeVisible: true,
        },
        take: 8,
      });

  return NextResponse.json({ products });
}
