import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const productId = url.searchParams.get("productId");
  if (!slug || !productId) {
    return NextResponse.json({ recentBuyers: 0 });
  }

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeSocialProofEnabled: true },
  });
  if (!shop?.storeSocialProofEnabled) {
    return NextResponse.json({ recentBuyers: 0 });
  }

  const since = new Date(Date.now() - 7 * 86400000);
  const count = await prisma.storeOrderItem.count({
    where: {
      productId,
      storeOrder: { shopId: shop.id, createdAt: { gte: since }, status: { not: "cancelled" } },
    },
  });

  return NextResponse.json({ recentBuyers: count });
}
