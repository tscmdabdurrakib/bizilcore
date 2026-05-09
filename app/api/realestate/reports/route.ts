import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);

  const [totalProps, totalLeads, totalDeals, commissionTotal, propTypeBreakdown, dealsByMonth, leadStageBreakdown] = await Promise.all([
    prisma.property.count({ where: { shopId: shop.id } }),
    prisma.propertyLead.count({ where: { shopId: shop.id } }),
    prisma.deal.count({ where: { shopId: shop.id, status: "completed" } }),
    prisma.deal.aggregate({ where: { shopId: shop.id, status: "completed" }, _sum: { commissionAmount: true } }),
    prisma.property.groupBy({ by: ["type"], where: { shopId: shop.id }, _count: true }),
    prisma.$queryRaw<{ month: string; commission: number; deals: bigint }[]>`
      SELECT TO_CHAR("dealDate", 'Mon YY') AS month, COALESCE(SUM("commissionAmount"), 0) AS commission, COUNT(*) AS deals
      FROM "Deal"
      WHERE "shopId" = ${shop.id} AND "dealDate" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("dealDate", 'Mon YY'), DATE_TRUNC('month', "dealDate")
      ORDER BY DATE_TRUNC('month', "dealDate")
    `,
    prisma.propertyLead.groupBy({ by: ["stage"], where: { shopId: shop.id }, _count: true }),
  ]);

  return NextResponse.json({
    totalProps, totalLeads, totalDeals,
    totalCommission: commissionTotal._sum.commissionAmount ?? 0,
    propTypeBreakdown: propTypeBreakdown.map(r => ({ type: r.type, count: r._count })),
    dealsByMonth: dealsByMonth.map(r => ({ month: r.month, commission: Number(r.commission), deals: Number(r.deals) })),
    leadStageBreakdown: leadStageBreakdown.map(r => ({ stage: r.stage, count: r._count })),
  });
}
