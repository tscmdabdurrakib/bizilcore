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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const { id } = await params;

  const combo = await prisma.comboProduct.findUnique({
    where: { id },
    include: { items: { include: ITEM_INCLUDE } },
  });
  if (!combo || combo.shopId !== shop.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...combo, availableStock: computeAvailableStock(combo.items) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const { id } = await params;

  const existing = await prisma.comboProduct.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shop.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.sellPrice !== undefined) {
    const parsedPrice = parseFloat(body.sellPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0)
      return NextResponse.json({ error: "Sell price must be greater than 0" }, { status: 400 });
    updateData.sellPrice = parsedPrice;
  }
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl?.trim() || null;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (Array.isArray(body.items)) {
    const validItems = body.items.filter((it: { productId?: string }) => !!it.productId);
    if (validItems.length < 2) {
      return NextResponse.json({ error: "A combo must have at least 2 component products" }, { status: 400 });
    }
    for (const item of validItems as { productId?: string; quantity?: number }[]) {
      if (!item.quantity || Number(item.quantity) < 1)
        return NextResponse.json({ error: "Each component quantity must be at least 1" }, { status: 400 });
    }

    // Cross-shop product validation (deduplicate so same product with different variants isn't falsely rejected)
    const allProductIds: string[] = validItems.map((it: { productId: string }) => it.productId);
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

    // Validate variantIds belong to correct products in this shop
    const variantItems = validItems.filter((it: { variantId?: string }) => it.variantId);
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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.comboItem.deleteMany({ where: { comboId: id } });
      await tx.comboItem.createMany({
        data: validItems.map((it: { productId: string; variantId?: string; quantity: number }) => ({
          comboId: id,
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: parseInt(String(it.quantity)) || 1,
        })),
      });
      return tx.comboProduct.update({
        where: { id },
        data: updateData,
        include: { items: { include: ITEM_INCLUDE } },
      });
    });
    return NextResponse.json({ ...updated, availableStock: computeAvailableStock(updated.items) });
  }

  const updated = await prisma.comboProduct.update({
    where: { id },
    data: updateData,
    include: { items: { include: ITEM_INCLUDE } },
  });

  return NextResponse.json({ ...updated, availableStock: computeAvailableStock(updated.items) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const { id } = await params;

  const existing = await prisma.comboProduct.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shop.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.comboProduct.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
