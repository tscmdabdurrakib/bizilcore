import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json();

  const discount = await prisma.smsCreditDiscount.update({
    where: { id },
    data: {
      code: body.code?.trim()?.toUpperCase() || null,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minPurchaseAmount: body.minPurchaseAmount,
      maxUses: body.maxUses,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      description: body.description,
      isActive: body.isActive,
    },
  });
  return NextResponse.json({ discount });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  await prisma.smsCreditDiscount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
