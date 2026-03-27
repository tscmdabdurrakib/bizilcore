import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel, CK, TTL } from "@/lib/cache";
import { logActivity } from "@/lib/logActivity";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  return shop?.id;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 50);
  const search = searchParams.get("search") ?? "";
  const noCache = searchParams.get("nocache") === "1";
  const all = searchParams.get("all") === "1";
  const withVariants = searchParams.get("withVariants") === "1";

  const whereClause = {
    shopId,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  if (all || withVariants) {
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: withVariants ? { variants: { orderBy: { createdAt: "asc" } } } : undefined,
    });
    return NextResponse.json(products);
  }

  // Cache only page 1 with no search
  const shouldCache = page === 1 && !search;
  const cacheKey = CK.products(shopId);

  if (shouldCache && !noCache) {
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  if (shouldCache) cacheSet(cacheKey, products, TTL.PRODUCTS);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const hasVariants = !!body.hasVariants && Array.isArray(body.variants) && body.variants.length > 0;

  const product = await prisma.product.create({
    data: {
      name: body.name,
      buyPrice: parseFloat(body.buyPrice) || 0,
      sellPrice: parseFloat(body.sellPrice) || 0,
      stockQty: parseInt(body.stockQty) || 0,
      lowStockAt: parseInt(body.lowStockAt) || 5,
      sku: body.sku?.trim() || null,
      category: body.category || null,
      description: body.description?.trim() || null,
      imageUrl: body.imageUrl || null,
      images: body.images || null,
      hasVariants,
      shopId,
    },
  });

  if (hasVariants && body.variants?.length > 0) {
    await prisma.productVariant.createMany({
      data: body.variants.map((v: Record<string, unknown>, i: number) => ({
        id: `var_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        name: String(v.name ?? ""),
        size: v.size ? String(v.size) : null,
        color: v.color ? String(v.color) : null,
        sku: v.sku ? String(v.sku) : null,
        price: v.price != null ? parseFloat(String(v.price)) : null,
        buyPrice: v.buyPrice != null ? parseFloat(String(v.buyPrice)) : null,
        stockQty: parseInt(String(v.stockQty ?? 0)) || 0,
      })),
    });
  }

  cacheDel(CK.products(shopId));
  await logActivity({
    shopId,
    userId: session.user.id,
    action: "নতুন পণ্য যোগ",
    detail: `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""} · স্টক: ${product.stockQty}`,
  });
  return NextResponse.json(product, { status: 201 });
}
