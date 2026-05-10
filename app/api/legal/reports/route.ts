import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [
    casesByType,
    casesByStatus,
    recentMonthCases,
    pendingFees,
    hearingAttendance,
  ] = await Promise.all([
    prisma.legalCase.groupBy({
      by: ["caseType"],
      where: { shopId: shop.id },
      _count: { id: true },
    }),
    prisma.legalCase.groupBy({
      by: ["status"],
      where: { shopId: shop.id },
      _count: { id: true },
    }),
    prisma.legalCase.findMany({
      where: { shopId: shop.id, createdAt: { gte: monthStart } },
      select: { id: true, caseNumber: true, title: true, retainerFee: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.legalCase.findMany({
      where: { shopId: shop.id, dueFee: { gt: 0 } },
      include: { client: { select: { name: true, phone: true } } },
      orderBy: { dueFee: "desc" },
      take: 20,
    }),
    prisma.caseHearing.groupBy({
      by: ["attended"],
      where: { shopId: shop.id, hearingDate: { lt: new Date() } },
      _count: { id: true },
    }),
  ]);

  const last6Months: { month: string; cases: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setMonth(end.getMonth() + 1);

    const [cnt, rev] = await Promise.all([
      prisma.legalCase.count({ where: { shopId: shop.id, createdAt: { gte: d, lt: end } } }),
      prisma.caseFeePayment.aggregate({
        where: { shopId: shop.id, paidAt: { gte: d, lt: end } },
        _sum: { amount: true },
      }),
    ]);

    last6Months.push({
      month: d.toLocaleString("bn-BD", { month: "short", year: "2-digit" }),
      cases: cnt,
      revenue: rev._sum.amount ?? 0,
    });
  }

  return NextResponse.json({
    casesByType,
    casesByStatus,
    recentMonthCases,
    pendingFees,
    hearingAttendance,
    last6Months,
  });
}
