import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);

  const [
    activeCases,
    todayHearings,
    weekHearings,
    pendingFeeSum,
    todayHearingList,
    upcomingHearings,
    overdueFees,
  ] = await Promise.all([
    prisma.legalCase.count({
      where: { shopId: shop.id, status: { in: ["active", "hearing_pending"] } },
    }),
    prisma.caseHearing.count({
      where: {
        shopId: shop.id,
        hearingDate: { gte: today, lt: tomorrow },
      },
    }),
    prisma.caseHearing.count({
      where: {
        shopId: shop.id,
        hearingDate: { gte: today, lt: weekEnd },
      },
    }),
    prisma.legalCase.aggregate({
      where: { shopId: shop.id, dueFee: { gt: 0 } },
      _sum: { dueFee: true },
    }),
    prisma.caseHearing.findMany({
      where: {
        shopId: shop.id,
        hearingDate: { gte: today, lt: tomorrow },
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            court: true,
            client: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { hearingDate: "asc" },
    }),
    prisma.caseHearing.findMany({
      where: {
        shopId: shop.id,
        hearingDate: { gte: tomorrow, lt: weekEnd },
        attended: false,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            court: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { hearingDate: "asc" },
    }),
    prisma.legalCase.findMany({
      where: {
        shopId: shop.id,
        dueFee: { gt: 0 },
        payments: {
          none: {
            paidAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        client: { select: { name: true, phone: true } },
      },
      orderBy: { dueFee: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    activeCases,
    todayHearings,
    weekHearings,
    pendingFeeSum: pendingFeeSum._sum.dueFee ?? 0,
    todayHearingList,
    upcomingHearings,
    overdueFees,
  });
}
