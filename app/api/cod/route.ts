import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courierFilter = searchParams.get("courier") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const remittedParam = searchParams.get("remitted");

  const userId = session.user.id;

  const codScope = {
    userId,
    courierName: { not: null as null },
    status: { in: ["shipped", "delivered"] },
  };

  const dateFromDt = dateFrom ? new Date(dateFrom + "T00:00:00.000Z") : null;
  const dateToDt = dateTo ? new Date(dateTo + "T23:59:59.999Z") : null;
  const dateRange = dateFromDt || dateToDt ? {
    ...(dateFromDt ? { gte: dateFromDt } : {}),
    ...(dateToDt ? { lte: dateToDt } : {}),
  } : null;

  const filteredWhere: Record<string, unknown> = {
    ...codScope,
    ...(courierFilter ? { courierName: courierFilter } : {}),
    ...(remittedParam !== null && remittedParam !== "" ? { codRemitted: remittedParam === "1" } : {}),
    ...(dateRange ? {
      OR: [
        { courierBookedAt: dateRange },
        { courierBookedAt: null, createdAt: dateRange },
      ],
    } : {}),
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [globalOrders, filteredOrders] = await Promise.all([
    prisma.order.findMany({
      where: codScope,
      select: {
        id: true,
        codRemitted: true,
        codRemittedAt: true,
        courierName: true,
        totalAmount: true,
        createdAt: true,
        courierBookedAt: true,
        status: true,
      },
    }),
    prisma.order.findMany({
      where: filteredWhere,
      select: {
        id: true,
        status: true,
        codStatus: true,
        codRemitted: true,
        codRemittedAt: true,
        courierName: true,
        courierTrackId: true,
        courierStatus: true,
        totalAmount: true,
        deliveryCharge: true,
        createdAt: true,
        courierBookedAt: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ courierName: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const totalPending = globalOrders
    .filter(o => !o.codRemitted)
    .reduce((s, o) => s + o.totalAmount, 0);

  const collectedThisMonth = globalOrders
    .filter(o => o.codRemitted && o.codRemittedAt && new Date(o.codRemittedAt) >= startOfMonth)
    .reduce((s, o) => s + o.totalAmount, 0);

  const overdueAmount = globalOrders
    .filter(o => {
      if (o.codRemitted) return false;
      if (o.status !== "delivered") return false;
      const refDate = o.courierBookedAt ? new Date(o.courierBookedAt) : new Date(o.createdAt);
      return refDate < sevenDaysAgo;
    })
    .reduce((s, o) => s + o.totalAmount, 0);

  const courierMap = new Map<string, { totalOrders: number; totalPending: number; totalRemitted: number; overdueAmount: number }>();
  for (const o of globalOrders) {
    const c = o.courierName ?? "other";
    if (!courierMap.has(c)) courierMap.set(c, { totalOrders: 0, totalPending: 0, totalRemitted: 0, overdueAmount: 0 });
    const entry = courierMap.get(c)!;
    entry.totalOrders += 1;
    if (o.codRemitted) {
      entry.totalRemitted += o.totalAmount;
    } else {
      entry.totalPending += o.totalAmount;
      if (o.status === "delivered") {
        const refDate = o.courierBookedAt ? new Date(o.courierBookedAt) : new Date(o.createdAt);
        if (refDate < sevenDaysAgo) {
          entry.overdueAmount += o.totalAmount;
        }
      }
    }
  }

  const courierSummary = Array.from(courierMap.entries())
    .map(([courier, data]) => ({ courier, ...data }))
    .sort((a, b) => b.totalPending - a.totalPending);

  return NextResponse.json({
    kpis: {
      totalPending,
      collectedThisMonth,
      overdueAmount,
      totalOrders: globalOrders.length,
    },
    courierSummary,
    orders: filteredOrders,
    total: filteredOrders.length,
  });
}
