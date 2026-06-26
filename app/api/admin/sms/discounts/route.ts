import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const discounts = await prisma.smsCreditDiscount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ discounts });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const discount = await prisma.smsCreditDiscount.create({
    data: {
      code: body.code?.trim()?.toUpperCase() || null,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minPurchaseAmount: body.minPurchaseAmount ?? 0,
      maxUses: body.maxUses ?? null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      description: body.description ?? null,
      createdBy: authResult.userId,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json({ discount });
}
