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

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["paid", "completed"] },
      createdAt: { gte: start, lte: end },
    },
    include: {
      items: { include: { menuItem: { select: { name: true, category: true } } } },
      table: { select: { number: true, floor: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue  = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalVat      = orders.reduce((s, o) => s + o.vatAmount, 0);
  const totalService  = orders.reduce((s, o) => s + o.serviceAmount, 0);
  const totalDiscount = orders.reduce((s, o) => s + o.discount, 0);
  const totalOrders   = orders.length;

  const paymentBreakdown: Record<string, { count: number; amount: number }> = {};
  for (const o of orders) {
    const m = o.paymentMethod ?? "cash";
    if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 };
    paymentBreakdown[m].count++;
    paymentBreakdown[m].amount += o.totalAmount;
  }

  const orderTypeBreakdown: Record<string, number> = {};
  for (const o of orders) {
    orderTypeBreakdown[o.type] = (orderTypeBreakdown[o.type] ?? 0) + 1;
  }

  return NextResponse.json({
    date: dateParam ?? new Date().toISOString().slice(0, 10),
    totalRevenue, totalVat, totalService, totalDiscount, totalOrders,
    paymentBreakdown: Object.entries(paymentBreakdown).map(([method, v]) => ({ method, ...v })),
    orderTypeBreakdown: Object.entries(orderTypeBreakdown).map(([type, count]) => ({ type, count })),
    orders: orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: o.status,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName,
      tableNumber: o.table?.number ?? null,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  });
}
