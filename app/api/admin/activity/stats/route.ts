import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday, startOfWeek } from "@/lib/activity/adminQueries";

export async function GET() {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const today = startOfToday();
  const weekStart = startOfWeek();
  const monthYear = new Date().toISOString().slice(0, 7);

  const [
    activeUsersToday,
    errorCountToday,
    topFeatureRows,
    topShopRows,
    mostActiveShopRow,
  ] = await Promise.all([
    prisma.userActivityLog.findMany({
      where: { createdAt: { gte: today }, actionType: { not: "page_leave" } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.userActivityLog.count({
      where: { createdAt: { gte: today }, actionType: "error" },
    }),
    prisma.featureUsageStat.groupBy({
      by: ["featureName"],
      where: { monthYear },
      _sum: { usageCount: true },
      orderBy: { _sum: { usageCount: "desc" } },
      take: 1,
    }),
    prisma.userActivityLog.groupBy({
      by: ["shopId"],
      where: { createdAt: { gte: weekStart }, shopId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.userActivityLog.groupBy({
      by: ["shopId"],
      where: { createdAt: { gte: today }, shopId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
  ]);

  let mostActiveShop: { id: string; name: string; count: number } | null = null;
  if (mostActiveShopRow[0]?.shopId) {
    const shop = await prisma.shop.findUnique({
      where: { id: mostActiveShopRow[0].shopId },
      select: { id: true, name: true },
    });
    if (shop) {
      mostActiveShop = {
        id: shop.id,
        name: shop.name,
        count: mostActiveShopRow[0]._count.id,
      };
    }
  }

  const featureLabels: Record<string, string> = {
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    sms: "SMS",
    facebook_reply: "FB Reply",
  };

  return NextResponse.json({
    activeUsersToday: activeUsersToday.length,
    errorCountToday,
    topFeatureThisWeek: topFeatureRows[0]
      ? {
          name: topFeatureRows[0].featureName,
          label: featureLabels[topFeatureRows[0].featureName] ?? topFeatureRows[0].featureName,
          count: topFeatureRows[0]._sum.usageCount ?? 0,
        }
      : null,
    mostActiveShop,
    weeklyTopShopCount: topShopRows[0]?._count.id ?? 0,
  });
}
