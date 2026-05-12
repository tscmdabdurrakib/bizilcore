import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const material = await prisma.rawMaterial.findFirst({ where: { id, shopId: shop.id } });
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, unit, currentStock, reorderLevel, costPerUnit, adjustBy } = body;

  const updated = await prisma.rawMaterial.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(unit !== undefined && { unit }),
      ...(currentStock !== undefined && { currentStock: Number(currentStock) }),
      ...(reorderLevel !== undefined && { reorderLevel: Number(reorderLevel) }),
      ...(costPerUnit !== undefined && { costPerUnit: Number(costPerUnit) }),
      ...(adjustBy !== undefined && { currentStock: { increment: Number(adjustBy) } }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const material = await prisma.rawMaterial.findFirst({ where: { id, shopId: shop.id } });
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rawMaterial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
