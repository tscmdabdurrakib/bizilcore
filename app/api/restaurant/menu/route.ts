import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { shopId: shop.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.menuItem.findMany({
      where: { shopId: shop.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const categorized = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.menuCategoryId === cat.id),
  }));

  const uncategorized = items.filter(i => !i.menuCategoryId);

  return NextResponse.json({ categories: categorized, uncategorized });
}
