import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const coupons = await prisma.coupon.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    name, code, type, value, minOrder, maxDiscount, maxUse, expiresAt,
    applicableItemIds, applicableCategories,
    happyHourStart, happyHourEnd, happyHourDays,
    memberTier, bogoGetItemId, bogoGetQty, bogoGetDiscount,
  } = body;

  if (!code || !type || value === undefined) {
    return NextResponse.json({ error: "কোড, ধরন ও মান আবশ্যক" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({
    where: { shopId_code: { shopId: shop.id, code: code.toUpperCase() } },
  });
  if (existing) return NextResponse.json({ error: "এই কোড ইতিমধ্যে আছে" }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      shopId: shop.id,
      name: name || null,
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minOrder: minOrder ? Number(minOrder) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      maxUse: maxUse ? Number(maxUse) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      applicableItemIds: applicableItemIds ?? [],
      applicableCategories: applicableCategories ?? [],
      happyHourStart: happyHourStart || null,
      happyHourEnd: happyHourEnd || null,
      happyHourDays: happyHourDays ?? [0, 1, 2, 3, 4, 5, 6],
      memberTier: memberTier || null,
      bogoGetItemId: bogoGetItemId || null,
      bogoGetQty: bogoGetQty ? Number(bogoGetQty) : 1,
      bogoGetDiscount: bogoGetDiscount !== undefined ? Number(bogoGetDiscount) : 100,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
