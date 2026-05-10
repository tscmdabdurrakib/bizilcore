import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const now = new Date();

    // 6-month monthly revenue
    const months: { label: string; bdtRevenue: number; usdRevenue: number; hours: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleString("default", { month: "short", year: "2-digit" });

      const [bdtPaid, usdPaid, hoursLogged] = await Promise.all([
        prisma.freelanceInvoice.aggregate({
          where: { shopId: shop.id, status: "paid", currency: "BDT", paidAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
        }),
        prisma.freelanceInvoice.aggregate({
          where: { shopId: shop.id, status: "paid", currency: "USD", paidAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
        }),
        prisma.timeLog.aggregate({
          where: { shopId: shop.id, logDate: { gte: start, lte: end } },
          _sum: { hours: true },
        }),
      ]);

      months.push({
        label,
        bdtRevenue: bdtPaid._sum.totalAmount ?? 0,
        usdRevenue: usdPaid._sum.totalAmount ?? 0,
        hours: hoursLogged._sum.hours ?? 0,
      });
    }

    // Revenue by project type
    const projectsByType = await prisma.freelanceProject.groupBy({
      by: ["type"],
      where: { shopId: shop.id },
      _sum: { totalAmountBDT: true },
      _count: true,
    });

    // Top clients
    const allProjects = await prisma.freelanceProject.findMany({
      where: { shopId: shop.id },
      select: { clientId: true, totalAmountBDT: true, client: { select: { name: true } } },
    });
    const clientMap: Record<string, { name: string; revenue: number; count: number }> = {};
    for (const p of allProjects) {
      if (!clientMap[p.clientId]) clientMap[p.clientId] = { name: p.client.name, revenue: 0, count: 0 };
      clientMap[p.clientId].revenue += p.totalAmountBDT;
      clientMap[p.clientId].count++;
    }
    const topClients = Object.values(clientMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Invoice collection rate
    const [totalInvoices, paidInvoices, overdueInvoices] = await Promise.all([
      prisma.freelanceInvoice.count({ where: { shopId: shop.id, status: { not: "draft" } } }),
      prisma.freelanceInvoice.count({ where: { shopId: shop.id, status: "paid" } }),
      prisma.freelanceInvoice.count({ where: { shopId: shop.id, status: "overdue" } }),
    ]);

    // Project status summary
    const projectStatus = await prisma.freelanceProject.groupBy({
      by: ["status"],
      where: { shopId: shop.id },
      _count: true,
    });

    return NextResponse.json({
      monthlyChart: months,
      projectsByType,
      topClients,
      invoiceStats: { total: totalInvoices, paid: paidInvoices, overdue: overdueInvoices },
      projectStatus,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
