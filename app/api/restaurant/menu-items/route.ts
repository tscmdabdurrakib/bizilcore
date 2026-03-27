import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const availableOnly = searchParams.get("available") === "true";

  const items = await prisma.menuItem.findMany({
    where: {
      shopId: shop.id,
      ...(category && { category }),
      ...(availableOnly && { isAvailable: true }),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let body: {
    name?: string; nameEn?: string; category?: string; price?: number;
    costPrice?: number; imageUrl?: string; isAvailable?: boolean;
    isVeg?: boolean; prepMinutes?: number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: "Name and price required" }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      shopId: shop.id,
      name: body.name,
      nameEn: body.nameEn,
      category: body.category ?? "main",
      price: body.price,
      costPrice: body.costPrice,
      imageUrl: body.imageUrl,
      isAvailable: body.isAvailable ?? true,
      isVeg: body.isVeg ?? false,
      prepMinutes: body.prepMinutes ?? 15,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
