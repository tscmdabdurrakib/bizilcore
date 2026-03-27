import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const q = searchParams.get("q") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const featured = searchParams.get("featured") === "1";
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeEnabled: true, storeShowStock: true },
  });
  if (!shop || !shop.storeEnabled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where = {
    shopId: shop.id,
    storeVisible: true,
    ...(featured ? { storeFeatured: true } : {}),
    ...(category ? { category } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined ? {
      sellPrice: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      }
    } : {}),
  };

  const orderBy =
    sort === "price_asc" ? { sellPrice: "asc" as const } :
    sort === "price_desc" ? { sellPrice: "desc" as const } :
    { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: 60,
    select: {
      id: true, name: true, description: true, category: true,
      sellPrice: true, stockQty: true, imageUrl: true, images: true,
      hasVariants: true, storeVisible: true, storeFeatured: true,
      variants: {
        select: { id: true, name: true, size: true, color: true, price: true, stockQty: true },
      },
    },
  });

  const categories = await prisma.product.findMany({
    where: { shopId: shop.id, storeVisible: true, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json({
    products,
    categories: categories.map(c => c.category).filter(Boolean),
    showStock: shop.storeShowStock,
  });
}
