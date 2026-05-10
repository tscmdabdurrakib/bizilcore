import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      activeProjects,
      monthRevenueBDT,
      pendingInvoiceTotal,
      overdueProjects,
      projectsByStatus,
      recentProjects,
      upcomingDeadlines,
      usdMonthRevenue,
    ] = await Promise.all([
      prisma.freelanceProject.count({
        where: { shopId: shop.id, status: { in: ["in_progress", "review", "revision"] } },
      }),
      prisma.freelanceInvoice.aggregate({
        where: {
          shopId: shop.id,
          status: "paid",
          currency: "BDT",
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.freelanceInvoice.aggregate({
        where: {
          shopId: shop.id,
          status: { in: ["sent", "viewed"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.freelanceProject.count({
        where: {
          shopId: shop.id,
          deadline: { lt: now },
          status: { notIn: ["completed", "cancelled"] },
        },
      }),
      prisma.freelanceProject.groupBy({
        by: ["status"],
        where: { shopId: shop.id },
        _count: true,
      }),
      prisma.freelanceProject.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          projectNumber: true,
          title: true,
          status: true,
          deadline: true,
          totalAmountBDT: true,
          currency: true,
          totalAmount: true,
          client: { select: { id: true, name: true } },
          milestones: { select: { id: true, status: true } },
        },
      }),
      prisma.freelanceProject.findMany({
        where: {
          shopId: shop.id,
          deadline: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          status: { notIn: ["completed", "cancelled"] },
        },
        orderBy: { deadline: "asc" },
        take: 5,
        select: { id: true, projectNumber: true, title: true, deadline: true, status: true, client: { select: { name: true } } },
      }),
      prisma.freelanceInvoice.aggregate({
        where: {
          shopId: shop.id,
          status: "paid",
          currency: "USD",
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of projectsByStatus) {
      statusMap[row.status] = row._count;
    }

    return NextResponse.json({
      activeProjects,
      monthRevenueBDT: monthRevenueBDT._sum.totalAmount ?? 0,
      pendingInvoiceTotal: pendingInvoiceTotal._sum.totalAmount ?? 0,
      overdueProjects,
      projectsByStatus: statusMap,
      recentProjects,
      upcomingDeadlines,
      usdMonthRevenue: usdMonthRevenue._sum.totalAmount ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
