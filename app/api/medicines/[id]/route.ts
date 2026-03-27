import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const med = await prisma.medicine.findUnique({ where: { id } });
  if (!med || med.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { brandName, genericName, manufacturer, category, unit, sellPrice, buyPrice, stockQty, lowStockAt, requiresRx, isControlled, isActive } = body;

  const updated = await prisma.medicine.update({
    where: { id },
    data: {
      ...(brandName !== undefined && { brandName }),
      ...(genericName !== undefined && { genericName }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(category !== undefined && { category }),
      ...(unit !== undefined && { unit }),
      ...(sellPrice !== undefined && { sellPrice: Number(sellPrice) }),
      ...(buyPrice !== undefined && { buyPrice: Number(buyPrice) }),
      ...(stockQty !== undefined && { stockQty: Number(stockQty) }),
      ...(lowStockAt !== undefined && { lowStockAt: Number(lowStockAt) }),
      ...(requiresRx !== undefined && { requiresRx: Boolean(requiresRx) }),
      ...(isControlled !== undefined && { isControlled: Boolean(isControlled) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
    include: { batches: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const med = await prisma.medicine.findUnique({ where: { id } });
  if (!med || med.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  await prisma.medicine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
