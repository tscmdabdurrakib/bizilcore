import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const coupon = await prisma.coupon.findFirst({ where: { id, shopId: shop.id } });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    name, code, type, value, minOrder, maxDiscount, maxUse, expiresAt, isActive,
    applicableItemIds, applicableCategories,
    happyHourStart, happyHourEnd, happyHourDays,
    memberTier, bogoGetItemId, bogoGetQty, bogoGetDiscount,
  } = body;

  if (code && code.toUpperCase() !== coupon.code) {
    const conflict = await prisma.coupon.findUnique({
      where: { shopId_code: { shopId: shop.id, code: code.toUpperCase() } },
    });
    if (conflict) return NextResponse.json({ error: "এই কোড ইতিমধ্যে আছে" }, { status: 409 });
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code: code.toUpperCase() }),
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value: Number(value) }),
      ...(minOrder !== undefined && { minOrder: minOrder ? Number(minOrder) : null }),
      ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
      ...(maxUse !== undefined && { maxUse: maxUse ? Number(maxUse) : null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(isActive !== undefined && { isActive }),
      ...(applicableItemIds !== undefined && { applicableItemIds }),
      ...(applicableCategories !== undefined && { applicableCategories }),
      ...(happyHourStart !== undefined && { happyHourStart: happyHourStart || null }),
      ...(happyHourEnd !== undefined && { happyHourEnd: happyHourEnd || null }),
      ...(happyHourDays !== undefined && { happyHourDays }),
      ...(memberTier !== undefined && { memberTier: memberTier || null }),
      ...(bogoGetItemId !== undefined && { bogoGetItemId: bogoGetItemId || null }),
      ...(bogoGetQty !== undefined && { bogoGetQty: Number(bogoGetQty) }),
      ...(bogoGetDiscount !== undefined && { bogoGetDiscount: Number(bogoGetDiscount) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const coupon = await prisma.coupon.findFirst({ where: { id, shopId: shop.id } });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
