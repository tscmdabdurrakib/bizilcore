import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true, name: true, logoUrl: true, restVatPct: true, restServiceChargePct: true },
  });
  if (!shop) return NextResponse.json({ error: "রেস্তোরাঁ পাওয়া যায়নি" }, { status: 404 });

  const items = await prisma.menuItem.findMany({
    where: { shopId: shop.id, isAvailable: true },
    select: {
      id: true, name: true, nameEn: true, category: true, price: true,
      isVeg: true, imageUrl: true, prepMinutes: true, variants: true, addons: true,
      menuCategory: { select: { id: true, name: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    shop: { name: shop.name, logoUrl: shop.logoUrl, vatPct: shop.restVatPct, servicePct: shop.restServiceChargePct },
    items,
  });
}
