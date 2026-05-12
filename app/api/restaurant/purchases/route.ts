import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get("materialId");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (materialId) where.materialId = materialId;

  const entries = await prisma.purchaseEntry.findMany({
    where,
    include: { material: { select: { id: true, name: true, unit: true } } },
    orderBy: { purchasedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { materialId, quantity, unitCost, note, purchasedAt } = body;
  if (!materialId || !quantity || !unitCost) {
    return NextResponse.json({ error: "materialId, quantity, unitCost required" }, { status: 400 });
  }

  const material = await prisma.rawMaterial.findFirst({ where: { id: materialId, shopId: shop.id } });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  const qty = Number(quantity);
  const cost = Number(unitCost);
  const total = qty * cost;

  const [entry] = await prisma.$transaction([
    prisma.purchaseEntry.create({
      data: {
        shopId: shop.id,
        materialId,
        quantity: qty,
        unitCost: cost,
        totalCost: total,
        note: note || null,
        purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
      },
      include: { material: { select: { id: true, name: true, unit: true } } },
    }),
    prisma.rawMaterial.update({
      where: { id: materialId },
      data: { currentStock: { increment: qty } },
    }),
  ]);

  return NextResponse.json(entry, { status: 201 });
}
