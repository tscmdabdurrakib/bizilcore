import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [
    activeProperties,
    monthLeads,
    activeDeals,
    commissionRows,
    leadsByStage,
    propsByStatus,
    followUpDue,
  ] = await Promise.all([
    prisma.property.count({ where: { shopId: shop.id, status: { in: ["available", "under_negotiation"] } } }),
    prisma.propertyLead.count({ where: { shopId: shop.id, createdAt: { gte: monthStart } } }),
    prisma.deal.count({ where: { shopId: shop.id, status: "in_progress" } }),
    prisma.deal.aggregate({
      where: { shopId: shop.id, status: "completed", completionDate: { gte: monthStart } },
      _sum: { commissionAmount: true },
    }),
    prisma.propertyLead.groupBy({
      by: ["stage"],
      where: { shopId: shop.id, stage: { not: "deal_done" } },
      _count: true,
    }),
    prisma.property.groupBy({
      by: ["status"],
      where: { shopId: shop.id },
      _count: true,
    }),
    prisma.propertyLead.findMany({
      where: {
        shopId: shop.id,
        followUpDate: { lte: todayEnd },
        stage: { notIn: ["deal_done", "lost"] },
      },
      select: { id: true, clientName: true, clientPhone: true, stage: true, followUpDate: true, requirement: true, propertyId: true },
      orderBy: { followUpDate: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    activeProperties,
    monthLeads,
    activeDeals,
    monthCommission: commissionRows._sum.commissionAmount ?? 0,
    leadsByStage: leadsByStage.map(r => ({ stage: r.stage, count: r._count })),
    propsByStatus: propsByStatus.map(r => ({ status: r.status, count: r._count })),
    followUpDue: followUpDue.map(l => ({
      ...l,
      followUpDate: l.followUpDate?.toISOString() ?? null,
    })),
  });
}
