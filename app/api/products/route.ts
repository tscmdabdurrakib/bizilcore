import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { trackForUser } from "@/lib/activity/trackFromSession";
import { checkAndAwardBadges } from "@/lib/badges";
import { markSetupTask } from "@/lib/setupProgress";
import { getCachedProductsPage1, fetchProductsUncached } from "@/lib/data/cached-queries";
import { revalidateProducts } from "@/lib/cache/revalidate";

async function getShopId() {
  const { getActiveShopForApi } = await import("@/lib/shops/access");
  const ctx = await getActiveShopForApi();
  if ("error" in ctx) return null;
  return ctx.activeShop.id;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId();
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 50);
  const search = searchParams.get("search") ?? "";
  const all = searchParams.get("all") === "1";
  const withVariants = searchParams.get("withVariants") === "1";

  if (page === 1 && !search && !all && !withVariants) {
    const products = await getCachedProductsPage1(shopId, limit);
    return NextResponse.json(products);
  }

  const products = await fetchProductsUncached(shopId, { page, limit, search, all, withVariants });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId();
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

  revalidateProducts(shopId);
  await logActivity({
    shopId,
    userId: session.user.id,
    action: "নতুন পণ্য যোগ",
    detail: `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""} · স্টক: ${product.stockQty}`,
  });
  trackForUser(session.user.id, shopId, {
    actionType: "product_added",
    actionLabel: `নতুন পণ্য যোগ: ${product.name}`,
    metadata: { product_id: product.id, product_name: product.name },
  }).catch(() => {});
  checkAndAwardBadges(session.user.id, "product_added").catch(() => {});
  markSetupTask(session.user.id, "first_product").catch(() => {});
  return NextResponse.json(product, { status: 201 });
}
