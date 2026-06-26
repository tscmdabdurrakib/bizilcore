import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const FEATURE_COLUMNS = ["orders", "products", "customers", "sms", "facebook_reply"] as const;

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const [shops, stats] = await Promise.all([
    prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.featureUsageStat.findMany({
      where: { monthYear: month },
    }),
  ]);

  const statMap = new Map<string, Record<string, number>>();
  for (const row of stats) {
    if (!statMap.has(row.shopId)) statMap.set(row.shopId, {});
    statMap.get(row.shopId)![row.featureName] = row.usageCount;
  }

  const rows = shops.map((shop) => {
    const counts = statMap.get(shop.id) ?? {};
    const values = FEATURE_COLUMNS.map((f) => counts[f] ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    return {
      shopId: shop.id,
      shopName: shop.name,
      orders: counts.orders ?? 0,
      products: counts.products ?? 0,
      customers: counts.customers ?? 0,
      sms: counts.sms ?? 0,
      facebook_reply: counts.facebook_reply ?? 0,
      total,
      atRisk: total <= 2,
    };
  });

  return NextResponse.json({ month, rows, features: FEATURE_COLUMNS });
}
