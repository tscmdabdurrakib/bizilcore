import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const templates = await prisma.cateringMenuTemplate.findMany({
    where: { shopId: shop.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const { name, type, items = [] } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "নাম ও ধরন প্রয়োজন" }, { status: 400 });
  }

  const perHeadPrice = items.reduce((s: number, i: { perHeadCost: number }) => s + (Number(i.perHeadCost) || 0), 0);

  const template = await prisma.cateringMenuTemplate.create({
    data: {
      shopId: shop.id,
      name,
      type,
      perHeadPrice,
      items: {
        create: items.map((i: { itemName: string; category: string; perHeadCost: number; quantity?: string }) => ({
          itemName:    i.itemName,
          category:    i.category,
          perHeadCost: Number(i.perHeadCost) || 0,
          quantity:    i.quantity || null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(template);
}
