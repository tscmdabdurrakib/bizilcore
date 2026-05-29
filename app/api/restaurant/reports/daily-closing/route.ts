import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const date = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  // Fully paid/completed orders for the day
  const paidOrders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["paid", "completed"] },
      createdAt: { gte: start, lte: end },
      isVoided: false,
    },
    include: {
      items: { include: { menuItem: { select: { name: true, category: true } } } },
      table: { select: { number: true, floor: true } },
      splits: { orderBy: { splitIndex: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Orders with outstanding dues (partially paid, created today or still open)
  const partialOrders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      dueAmount: { gt: 0 },
      createdAt: { gte: start, lte: end },
      isVoided: false,
    },
    include: {
      table: { select: { number: true, floor: true } },
      splits: { orderBy: { splitIndex: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // All-time open dues (orders created any day with dueAmount > 0, not yet closed)
  const allOpenDueOrders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      dueAmount: { gt: 0 },
      isVoided: false,
      status: { notIn: ["cancelled"] },
    },
    select: {
      id: true,
      orderNumber: true,
      dueAmount: true,
      paidAmount: true,
      totalAmount: true,
      createdAt: true,
      customerName: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Aggregates for paid orders
  const totalRevenue  = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalVat      = paidOrders.reduce((s, o) => s + o.vatAmount, 0);
  const totalService  = paidOrders.reduce((s, o) => s + o.serviceAmount, 0);
  const totalDiscount = paidOrders.reduce((s, o) => s + o.discount, 0);
  const totalOrders   = paidOrders.length;

  // Partial payment metrics
  const totalPartialOrders = partialOrders.length;
  const totalPartialCollected = partialOrders.reduce((s, o) => s + o.paidAmount, 0);
  const totalDueToday = partialOrders.reduce((s, o) => s + o.dueAmount, 0);
  const totalAllOpenDue = allOpenDueOrders.reduce((s, o) => s + o.dueAmount, 0);

  // Payment method breakdown — from paid orders (direct) + splits
  const paymentBreakdown: Record<string, { count: number; amount: number }> = {};

  for (const o of paidOrders) {
    if (o.splits.length > 0) {
      // Split payment — credit per split line
      for (const sp of o.splits) {
        const m = sp.paymentMethod;
        if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 };
        paymentBreakdown[m].amount += sp.amount;
      }
      // Count the order once under "split"
      if (!paymentBreakdown["split"]) paymentBreakdown["split"] = { count: 0, amount: 0 };
      paymentBreakdown["split"].count++;
    } else {
      const m = o.paymentMethod ?? "cash";
      if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 };
      paymentBreakdown[m].count++;
      paymentBreakdown[m].amount += o.totalAmount;
    }
  }

  // Also include partial collections from today's partial orders
  for (const o of partialOrders) {
    for (const sp of o.splits) {
      const m = sp.paymentMethod;
      const key = `partial_${m}`;
      if (!paymentBreakdown[key]) paymentBreakdown[key] = { count: 0, amount: 0 };
      paymentBreakdown[key].count++;
      paymentBreakdown[key].amount += sp.amount;
    }
  }

  const orderTypeBreakdown: Record<string, number> = {};
  for (const o of paidOrders) {
    orderTypeBreakdown[o.type] = (orderTypeBreakdown[o.type] ?? 0) + 1;
  }

  return NextResponse.json({
    date: dateParam ?? new Date().toISOString().slice(0, 10),

    // Core metrics (paid orders)
    totalRevenue,
    totalVat,
    totalService,
    totalDiscount,
    totalOrders,

    // Partial / due metrics
    totalPartialOrders,
    totalPartialCollected,
    totalDueToday,
    totalAllOpenDue,

    // Breakdowns
    paymentBreakdown: Object.entries(paymentBreakdown).map(([method, v]) => ({ method, ...v })),
    orderTypeBreakdown: Object.entries(orderTypeBreakdown).map(([type, count]) => ({ type, count })),

    // Outstanding dues summary
    openDueOrders: allOpenDueOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      dueAmount: o.dueAmount,
      createdAt: o.createdAt,
    })),

    // Order list
    orders: paidOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: o.status,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      dueAmount: o.dueAmount,
      paymentMethod: o.splits.length > 0 ? "split" : (o.paymentMethod ?? "cash"),
      splitCount: o.splits.length,
      customerName: o.customerName,
      tableNumber: o.table?.number ?? null,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    })),

    // Today's partial orders
    partialOrderList: partialOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      dueAmount: o.dueAmount,
      tableNumber: o.table?.number ?? null,
      createdAt: o.createdAt,
      splits: o.splits.map(sp => ({
        amount: sp.amount,
        paymentMethod: sp.paymentMethod,
        paidAt: sp.paidAt,
      })),
    })),
  });
}
