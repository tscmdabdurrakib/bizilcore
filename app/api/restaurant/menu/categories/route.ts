import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const cats = await prisma.menuCategory.findMany({
    where: { shopId: shop.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  let body: { name?: string; nameEn?: string; icon?: string; sortOrder?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const cat = await prisma.menuCategory.create({
    data: {
      shopId: shop.id,
      name: body.name,
      nameEn: body.nameEn,
      icon: body.icon,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(cat, { status: 201 });
}
