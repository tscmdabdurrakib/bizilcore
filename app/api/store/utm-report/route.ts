import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const since = new Date(Date.now() - days * 86400000);

  const orders = await prisma.storeOrder.findMany({
    where: {
      shopId: shopCtx.activeShop.id,
      createdAt: { gte: since },
      OR: [{ utmSource: { not: null } }, { utmCampaign: { not: null } }],
    },
    select: {
      id: true, orderNumber: true, totalAmount: true, utmSource: true, utmCampaign: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bySource: Record<string, { orders: number; revenue: number }> = {};
  const byCampaign: Record<string, { orders: number; revenue: number }> = {};

  for (const o of orders) {
    const src = o.utmSource || "(direct)";
    bySource[src] = bySource[src] || { orders: 0, revenue: 0 };
    bySource[src].orders++;
    bySource[src].revenue += o.totalAmount;

    if (o.utmCampaign) {
      byCampaign[o.utmCampaign] = byCampaign[o.utmCampaign] || { orders: 0, revenue: 0 };
      byCampaign[o.utmCampaign].orders++;
      byCampaign[o.utmCampaign].revenue += o.totalAmount;
    }
  }

  return NextResponse.json({
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
    bySource: Object.entries(bySource).map(([key, v]) => ({ source: key, ...v })).sort((a, b) => b.revenue - a.revenue),
    byCampaign: Object.entries(byCampaign).map(([key, v]) => ({ campaign: key, ...v })).sort((a, b) => b.revenue - a.revenue),
    recent: orders.slice(0, 20),
  });
}
