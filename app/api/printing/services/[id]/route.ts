import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const service = await prisma.printService.findFirst({ where: { id, shopId: shop.id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.printService.update({
    where: { id },
    data: {
      name: body.name ?? service.name,
      category: body.category ?? service.category,
      unit: body.unit ?? service.unit,
      pricePerUnit: body.pricePerUnit != null ? Number(body.pricePerUnit) : service.pricePerUnit,
      minQuantity: body.minQuantity != null ? Number(body.minQuantity) : service.minQuantity,
      description: body.description !== undefined ? body.description : service.description,
      isActive: body.isActive !== undefined ? body.isActive : service.isActive,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const service = await prisma.printService.findFirst({ where: { id, shopId: shop.id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.printService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
