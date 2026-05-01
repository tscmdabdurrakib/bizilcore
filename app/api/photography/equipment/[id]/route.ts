import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.photoEquipment.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await prisma.photoEquipment.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        category: body.category ?? existing.category,
        serialNumber: body.serialNumber !== undefined ? body.serialNumber : existing.serialNumber,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate,
        purchaseCost: body.purchaseCost !== undefined ? parseFloat(body.purchaseCost) : existing.purchaseCost,
        condition: body.condition ?? existing.condition,
        insuranceExp: body.insuranceExp ? new Date(body.insuranceExp) : existing.insuranceExp,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const existing = await prisma.photoEquipment.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.photoEquipment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
