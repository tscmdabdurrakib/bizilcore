import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeEnabled: true, storeShowStock: true, storeShowReviews: true },
  });
  if (!shop || !shop.storeEnabled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id, shopId: shop.id, storeVisible: true },
    select: {
      id: true, name: true, description: true, category: true,
      sellPrice: true, stockQty: true, imageUrl: true, images: true,
      hasVariants: true, storeVisible: true, storeFeatured: true,
      variants: {
        select: { id: true, name: true, size: true, color: true, price: true, stockQty: true },
      },
      storeReviews: shop.storeShowReviews ? {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, reviewerName: true, rating: true, comment: true, createdAt: true },
        take: 20,
      } : false,
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ product, showStock: shop.storeShowStock });
}
