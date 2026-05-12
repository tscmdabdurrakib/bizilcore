import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const item = await prisma.menuItem.findFirst({ where: { id, shopId: shop.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: {
    name?: string; nameEn?: string; category?: string; price?: number;
    costPrice?: number; imageUrl?: string; isAvailable?: boolean;
    isVeg?: boolean; prepMinutes?: number; menuCategoryId?: string | null;
    variants?: unknown; addons?: unknown;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      ...(body.isVeg !== undefined && { isVeg: body.isVeg }),
      ...(body.prepMinutes !== undefined && { prepMinutes: body.prepMinutes }),
      ...("menuCategoryId" in body && { menuCategoryId: body.menuCategoryId ?? null }),
      ...("variants" in body && { variants: body.variants ?? null }),
      ...("addons" in body && { addons: body.addons ?? null }),
    },
    include: { menuCategory: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const item = await prisma.menuItem.findFirst({ where: { id, shopId: shop.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasOrders = await prisma.restaurantOrderItem.count({ where: { menuItemId: id } });
  if (hasOrders > 0) {
    await prisma.menuItem.update({ where: { id }, data: { isAvailable: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
