import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}

function computeAvailableStock(
  items: { quantity: number; product: { stockQty: number }; variant: { stockQty: number } | null }[]
) {
  if (items.length === 0) return 0;
  return Math.floor(
    Math.min(...items.map(ci => (ci.variant ? ci.variant.stockQty : ci.product.stockQty) / ci.quantity))
  );
}

const ITEM_INCLUDE = {
  product: { select: { id: true, name: true, stockQty: true, imageUrl: true } },
  variant: { select: { id: true, name: true, stockQty: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "1";

  const combos = await prisma.comboProduct.findMany({
    where: { shopId: shop.id, ...(activeOnly ? { isActive: true } : {}) },
    include: { items: { include: ITEM_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(combos.map(c => ({ ...c, availableStock: computeAvailableStock(c.items) })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, sellPrice, imageUrl, items } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const parsedSellPrice = parseFloat(sellPrice);
  if (isNaN(parsedSellPrice) || parsedSellPrice <= 0)
    return NextResponse.json({ error: "Sell price must be greater than 0" }, { status: 400 });
  if (!Array.isArray(items) || items.length < 2)
    return NextResponse.json({ error: "A combo must have at least 2 component products" }, { status: 400 });
  for (const item of items as { productId?: string; quantity?: number }[]) {
    if (!item.quantity || Number(item.quantity) < 1)
      return NextResponse.json({ error: "Each component quantity must be at least 1" }, { status: 400 });
  }

  // Cross-shop product validation (deduplicate so same product with different variants isn't falsely rejected)
  const allProductIds: string[] = items.map((it: { productId: string }) => it.productId).filter(Boolean);
  const uniqueProductIds = [...new Set(allProductIds)];
  if (uniqueProductIds.length < 2)
    return NextResponse.json({ error: "A combo must contain at least 2 distinct products" }, { status: 400 });
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, shopId: shop.id },
    select: { id: true },
  });
  if (ownedProducts.length !== uniqueProductIds.length) {
    return NextResponse.json({ error: "One or more products do not belong to your shop" }, { status: 400 });
  }

  // Validate variantIds belong to the correct products
  const variantItems = items.filter((it: { variantId?: string; productId: string }) => it.variantId);
  if (variantItems.length > 0) {
    const variantIds: string[] = [...new Set(variantItems.map((it: { variantId: string }) => it.variantId))] as string[];
    const ownedVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { shopId: shop.id } },
      select: { id: true, productId: true },
    });
    const variantMap = Object.fromEntries(ownedVariants.map(v => [v.id, v.productId]));
    for (const it of variantItems) {
      if (!variantMap[it.variantId] || variantMap[it.variantId] !== it.productId) {
        return NextResponse.json({ error: "One or more variants do not match the selected product" }, { status: 400 });
      }
    }
  }

  const combo = await prisma.comboProduct.create({
    data: {
      shopId: shop.id,
      name: name.trim(),
      description: description?.trim() || null,
      sellPrice: parseFloat(sellPrice) || 0,
      imageUrl: imageUrl?.trim() || null,
      items: {
        create: items.map((it: { productId: string; variantId?: string; quantity: number }) => ({
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: parseInt(String(it.quantity)) || 1,
        })),
      },
    },
    include: { items: { include: ITEM_INCLUDE } },
  });

  return NextResponse.json({ ...combo, availableStock: computeAvailableStock(combo.items) }, { status: 201 });
}
