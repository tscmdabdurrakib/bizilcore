import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const materials = await prisma.rawMaterial.findMany({
    where: { shopId: shop.id },
    include: {
      _count: { select: { recipes: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    materials.map(m => ({ ...m, isLowStock: m.currentStock <= m.reorderLevel }))
  );
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { name, unit, currentStock, reorderLevel, costPerUnit } = body;
  if (!name) return NextResponse.json({ error: "নাম প্রয়োজন" }, { status: 400 });

  const material = await prisma.rawMaterial.create({
    data: {
      shopId: shop.id,
      name,
      unit: unit ?? "kg",
      currentStock: Number(currentStock ?? 0),
      reorderLevel: Number(reorderLevel ?? 1),
      costPerUnit: Number(costPerUnit ?? 0),
    },
  });

  return NextResponse.json(material, { status: 201 });
}
