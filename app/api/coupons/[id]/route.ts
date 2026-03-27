import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const coupon = await prisma.coupon.findFirst({ where: { id, shopId: shop.id } });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { code, type, value, minOrder, maxDiscount, maxUse, expiresAt, isActive } = body;

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(code !== undefined && { code: code.toUpperCase() }),
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value: Number(value) }),
      ...(minOrder !== undefined && { minOrder: minOrder != null ? Number(minOrder) : null }),
      ...(maxDiscount !== undefined && { maxDiscount: maxDiscount != null ? Number(maxDiscount) : null }),
      ...(maxUse !== undefined && { maxUse: maxUse != null ? Number(maxUse) : null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const coupon = await prisma.coupon.findFirst({ where: { id, shopId: shop.id } });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
