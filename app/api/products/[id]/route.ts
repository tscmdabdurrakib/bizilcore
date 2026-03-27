import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShopId(userId: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  return shop?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id, shopId },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const isPartialUpdate = body.storeVisible !== undefined || body.storeFeatured !== undefined;
  if (isPartialUpdate && !body.name) {
    const data: Record<string, unknown> = {};
    if (body.storeVisible !== undefined) data.storeVisible = Boolean(body.storeVisible);
    if (body.storeFeatured !== undefined) data.storeFeatured = Boolean(body.storeFeatured);
    const product = await prisma.product.update({ where: { id, shopId }, data });
    return NextResponse.json(product);
  }

  const product = await prisma.product.update({
    where: { id, shopId },
    data: {
      name: body.name,
      buyPrice: parseFloat(body.buyPrice),
      sellPrice: parseFloat(body.sellPrice),
      stockQty: parseInt(body.stockQty),
      lowStockAt: parseInt(body.lowStockAt) || 5,
      sku: body.sku?.trim() || null,
      category: body.category || null,
      description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
      imageUrl: body.imageUrl || null,
      images: body.images !== undefined ? body.images : undefined,
      hasVariants: body.hasVariants ?? undefined,
      storeVisible: body.storeVisible ?? undefined,
      storeFeatured: body.storeFeatured ?? undefined,
    },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id, shopId }, select: { name: true, shopId: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.orderItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id, shopId } });
  await logActivity({
    shopId: product.shopId,
    userId: session.user.id,
    action: "পণ্য মুছে ফেলা",
    detail: product.name,
  });
  return NextResponse.json({ success: true });
}
