import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  return shop?.id;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(variants);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const { id } = await params;
  const body = await req.json();

  if (body.replaceAll) {
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    const variants = body.variants ?? [];
    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map((v: Record<string, unknown>) => ({
          id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          productId: id,
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
    await prisma.product.update({
      where: { id },
      data: {
        hasVariants: variants.length > 0,
        stockQty: variants.length > 0
          ? variants.reduce((s: number, v: Record<string, unknown>) => s + (parseInt(String(v.stockQty ?? 0)) || 0), 0)
          : undefined,
      },
    });
    const result = await prisma.productVariant.findMany({ where: { productId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(result);
  }

  const variant = await prisma.productVariant.create({
    data: {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      productId: id,
      name: body.name,
      size: body.size || null,
      color: body.color || null,
      sku: body.sku || null,
      price: body.price != null ? parseFloat(body.price) : null,
      buyPrice: body.buyPrice != null ? parseFloat(body.buyPrice) : null,
      stockQty: parseInt(body.stockQty) || 0,
    },
  });
  return NextResponse.json(variant, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.productVariant.deleteMany({ where: { productId: id } });
  await prisma.product.update({ where: { id }, data: { hasVariants: false } });
  return NextResponse.json({ success: true });
}
