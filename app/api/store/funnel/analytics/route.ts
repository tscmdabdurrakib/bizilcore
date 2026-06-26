import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });
  const shop = shopCtx.activeShop;

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const since = new Date(Date.now() - days * 86400000);

  const events = await prisma.storeFunnelEvent.groupBy({
    by: ["eventType"],
    where: { shopId: shop.id, createdAt: { gte: since } },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(events.map((e) => [e.eventType, e._count._all]));
  const visits = counts.visit ?? 0;
  const purchases = counts.purchase ?? 0;

  return NextResponse.json({
    funnel: {
      visit: visits,
      product_view: counts.product_view ?? 0,
      add_to_cart: counts.add_to_cart ?? 0,
      checkout_start: counts.checkout_start ?? 0,
      purchase: purchases,
    },
    conversionRate: visits > 0 ? Math.round((purchases / visits) * 10000) / 100 : 0,
  });
}
