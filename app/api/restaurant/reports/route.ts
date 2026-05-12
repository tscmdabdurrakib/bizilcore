import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const DOW_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "summary";
  const dateParam = searchParams.get("date");

  if (type === "closing" && dateParam) {
    const date = new Date(dateParam);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const orders = await prisma.restaurantOrder.findMany({
      where: { shopId: shop.id, status: "paid", createdAt: { gte: date, lt: nextDay } },
      include: {
        items: { include: { menuItem: { select: { name: true, price: true } } } },
        waiter: { select: { id: true, user: { select: { name: true } } } },
      },
    });

    const gross       = orders.reduce((s, o) => s + o.totalAmount, 0);
    const vatSum      = orders.reduce((s, o) => s + (o.vatAmount     ?? 0), 0);
    const svcSum      = orders.reduce((s, o) => s + (o.serviceAmount ?? 0), 0);
    const discountSum = orders.reduce((s, o) => s + (o.discount       ?? 0), 0);
    const netSum      = orders.reduce((s, o) => s + (o.subtotal       ?? o.totalAmount), 0);
    const totalTips   = orders.reduce((s, o) => s + (o.tipAmount      ?? 0), 0);
    const orderCount  = orders.length;

    const dineIn   = orders.filter(o => o.type === "dine_in").length;
    const takeaway = orders.filter(o => o.type === "takeaway").length;
    const delivery = orders.filter(o => o.type === "delivery").length;

    const payMethodMap: Record<string, number> = {};
    for (const o of orders) {
      const m = o.paymentMethod ?? "cash";
      payMethodMap[m] = (payMethodMap[m] ?? 0) + o.totalAmount;
    }
    const paymentMethodBreakdown = Object.entries(payMethodMap).map(([method, amount]) => ({ method, amount }));

    const waiterTipMap = new Map<string, { name: string; tips: number; orders: number }>();
    for (const o of orders) {
      if (o.waiter) {
        const existing = waiterTipMap.get(o.waiter.id);
        if (existing) {
          existing.tips   += o.tipAmount ?? 0;
          existing.orders += 1;
        } else {
          waiterTipMap.set(o.waiter.id, {
            name:   o.waiter.user.name,
            tips:   o.tipAmount ?? 0,
            orders: 1,
          });
        }
      }
    }
    const waiterTips = Array.from(waiterTipMap.entries()).map(([id, v]) => ({ id, ...v }));

    return NextResponse.json({
      gross, vat: vatSum, serviceCharge: svcSum, discount: discountSum, net: netSum,
      totalTips, waiterTips, orderCount,
      orders: orders.map(o => ({
        id: o.id, orderNumber: o.orderNumber, type: o.type, status: o.status,
        totalAmount: o.totalAmount, paymentMethod: o.paymentMethod,
        customerName: o.customerName, tipAmount: o.tipAmount ?? 0,
        waiterName: o.waiter?.user?.name ?? null,
        items: o.items,
        createdAt: o.createdAt,
      })),
      orderTypeBreakdown: { dineIn, takeaway, delivery },
      paymentMethodBreakdown,
    });
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [allPaidOrders, allOrderItems] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where: { shopId: shop.id, status: "paid", createdAt: { gte: sixMonthsAgo } },
      select: {
        createdAt: true, totalAmount: true, type: true, paymentMethod: true,
        subtotal: true, vatAmount: true, serviceAmount: true,
      },
    }),
    prisma.restaurantOrderItem.findMany({
      where: { order: { shopId: shop.id, status: "paid", createdAt: { gte: sixMonthsAgo } } },
      include: { menuItem: { select: { id: true, name: true, category: true, price: true } } },
    }),
  ]);

  const monthlyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of allPaidOrders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      const m = monthlyMap.get(key)!;
      m.revenue += o.totalAmount;
      m.orders  += 1;
    }
  }
  const monthlyChart = Array.from(monthlyMap.entries()).map(([month, v]) => ({ month, ...v }));

  const itemQtyMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>();
  for (const item of allOrderItems) {
    const ex = itemQtyMap.get(item.menuItemId);
    if (ex) { ex.qty += item.quantity; ex.revenue += item.unitPrice * item.quantity; }
    else itemQtyMap.set(item.menuItemId, {
      name: item.menuItem.name, category: item.menuItem.category,
      qty: item.quantity, revenue: item.unitPrice * item.quantity,
    });
  }
  const bestSellers = Array.from(itemQtyMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const categoryMap = new Map<string, number>();
  for (const item of allOrderItems) {
    const cat = item.menuItem.category;
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.unitPrice * item.quantity);
  }
  const categoryRevenue = Array.from(categoryMap.entries()).map(([category, revenue]) => ({ category, revenue }));

  /* Peak Hours: simple hourly counts (24 buckets) */
  const peakHourMap = new Array(24).fill(0);
  for (const o of allPaidOrders) {
    peakHourMap[new Date(o.createdAt).getHours()] += 1;
  }
  const peakHours = peakHourMap.map((count, hour) => ({ hour, count }));

  /* Day-of-week × Hour heatmap: 7×24 matrix */
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const o of allPaidOrders) {
    const d = new Date(o.createdAt);
    heatmap[d.getDay()][d.getHours()] += 1;
  }
  const heatmapData = heatmap.map((hours, dow) => ({
    dow, dowLabel: DOW_BN[dow],
    hours: hours.map((count, hour) => ({ hour, count })),
  }));

  const orderTypeMap: Record<string, number> = {};
  for (const o of allPaidOrders) {
    orderTypeMap[o.type] = (orderTypeMap[o.type] ?? 0) + 1;
  }
  const orderTypeBreakdown = Object.entries(orderTypeMap).map(([type, count]) => ({ type, count }));

  const payMethodMap: Record<string, { count: number; amount: number }> = {};
  for (const o of allPaidOrders) {
    const m = o.paymentMethod ?? "cash";
    if (!payMethodMap[m]) payMethodMap[m] = { count: 0, amount: 0 };
    payMethodMap[m].count  += 1;
    payMethodMap[m].amount += o.totalAmount;
  }
  const paymentMethodBreakdown = Object.entries(payMethodMap).map(([method, v]) => ({ method, ...v }));

  const totalRevenue = allPaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalVat     = allPaidOrders.reduce((s, o) => s + (o.vatAmount     ?? 0), 0);
  const totalService = allPaidOrders.reduce((s, o) => s + (o.serviceAmount ?? 0), 0);

  return NextResponse.json({
    monthlyChart, bestSellers, categoryRevenue, peakHours, heatmapData,
    orderTypeBreakdown, paymentMethodBreakdown,
    totalRevenue, totalVat, totalService, totalOrders: allPaidOrders.length,
  });
}
