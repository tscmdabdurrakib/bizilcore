import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApiShop } from "@/lib/shops/api-shop";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;

  const coupons = await prisma.coupon.findMany({
    where: { shopId: ctx.activeShop.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { code, type, value, minOrder, maxDiscount, maxUse, expiresAt } = body;

  if (!code || !type || value == null) {
    return NextResponse.json({ error: "code, type, value আবশ্যক" }, { status: 400 });
  }

  const existing = await prisma.coupon.findFirst({
    where: { shopId: ctx.activeShop.id, code: code.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "এই কোড ইতিমধ্যে আছে" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      shopId: ctx.activeShop.id,
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
