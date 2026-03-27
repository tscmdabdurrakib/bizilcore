import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      phone: true,
      category: true,
      logoUrl: true,
      catalogEnabled: true,
      catalogTagline: true,
      catalogShowInStockOnly: true,
      products: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          sellPrice: true,
          stockQty: true,
          imageUrl: true,
          hasVariants: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!shop.catalogEnabled) {
    return NextResponse.json({ error: "Catalog not available" }, { status: 404 });
  }

  const products = shop.catalogShowInStockOnly
    ? shop.products.filter((p) => p.stockQty > 0)
    : shop.products;

  return NextResponse.json({
    shop: {
      name: shop.name,
      phone: shop.phone,
      category: shop.category,
      logoUrl: shop.logoUrl,
      tagline: shop.catalogTagline,
    },
    products,
  });
}
