import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();
  const { name, type, items, isActive } = body;

  const template = await prisma.cateringMenuTemplate.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!template) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined)     updateData.name     = name;
  if (type !== undefined)     updateData.type     = type;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (items !== undefined) {
    const perHeadPrice = items.reduce((s: number, i: { perHeadCost: number }) => s + (Number(i.perHeadCost) || 0), 0);
    updateData.perHeadPrice = perHeadPrice;
    await prisma.cateringTemplateItem.deleteMany({ where: { templateId: id } });
    updateData.items = {
      create: items.map((i: { itemName: string; category: string; perHeadCost: number; quantity?: string }) => ({
        itemName:    i.itemName,
        category:    i.category,
        perHeadCost: Number(i.perHeadCost) || 0,
        quantity:    i.quantity || null,
      })),
    };
  }

  const updated = await prisma.cateringMenuTemplate.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const template = await prisma.cateringMenuTemplate.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!template) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });

  const inUse = await prisma.cateringEvent.count({
    where: { templateId: id, status: { notIn: ["completed", "cancelled"] } },
  });
  if (inUse > 0) {
    return NextResponse.json({ error: "এই template টি সক্রিয় ইভেন্টে ব্যবহৃত হচ্ছে" }, { status: 409 });
  }

  await prisma.cateringMenuTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
