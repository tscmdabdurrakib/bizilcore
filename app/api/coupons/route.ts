import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const coupons = await prisma.coupon.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { code, type, value, minOrder, maxDiscount, maxUse, expiresAt } = body;

  if (!code || !type || value == null) {
    return NextResponse.json({ error: "code, type, value আবশ্যক" }, { status: 400 });
  }

  const existing = await prisma.coupon.findFirst({
    where: { shopId: shop.id, code: code.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "এই কোড ইতিমধ্যে আছে" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      shopId: shop.id,
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minOrder: minOrder != null ? Number(minOrder) : null,
      maxDiscount: maxDiscount != null ? Number(maxDiscount) : null,
      maxUse: maxUse != null ? Number(maxUse) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
