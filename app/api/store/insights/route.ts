import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Advanced fcommerce analytics (read-only). Computes profit, customer LTV,
 * RFM segments, repeat-purchase rate and courier performance from existing
 * Order/OrderItem/Customer/Product data — no writes, no new tracking.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const daysParam = parseInt(req.nextUrl.searchParams.get("days") ?? "365", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 730 ? daysParam : 365;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, createdAt: { gte: since } },
    select: {
      id: true,
      status: true,
      codStatus: true,
      courierStatus: true,
      courierName: true,
      totalAmount: true,
      paidAmount: true,
      createdAt: true,
      customerId: true,
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          subtotal: true,
          productId: true,
          product: { select: { name: true, buyPrice: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const isDelivered = (o: { status: string; codStatus: string | null; courierStatus: string | null; paidAmount: number }) =>
    o.status === "delivered" || o.codStatus === "collected" || o.courierStatus === "delivered" || o.paidAmount > 0;
  const isReturned = (o: { status: string; codStatus: string | null; courierStatus: string | null }) =>
    o.status === "cancelled" || o.codStatus === "returned" || o.courierStatus === "returned";

  // ── Profit per product ──────────────────────────────────────────────
  const productMap = new Map<string, { name: string; units: number; revenue: number; profit: number }>();
  // ── Profit per order ────────────────────────────────────────────────
  const orderProfits: { id: string; revenue: number; profit: number; date: string; customer: string | null }[] = [];

  // ── Courier performance ─────────────────────────────────────────────
  const courierMap = new Map<string, { delivered: number; returned: number; total: number }>();

  // ── RFM / LTV accumulation ──────────────────────────────────────────
  const custMap = new Map<string, { name: string; phone: string | null; orders: number; spend: number; lastOrder: number }>();

  for (const o of orders) {
    const delivered = isDelivered(o);
    const returned = isReturned(o);

    // Profit only counts realized (delivered/paid) orders.
    if (delivered && !returned) {
      let orderProfit = 0;
      let orderRevenue = 0;
      for (const it of o.items) {
        const buy = it.product?.buyPrice ?? 0;
        const lineProfit = (it.unitPrice - buy) * it.quantity;
        const lineRev = it.subtotal;
        orderProfit += lineProfit;
        orderRevenue += lineRev;
        if (it.productId) {
          const key = it.productId;
          const cur = productMap.get(key) ?? { name: it.product?.name ?? "পণ্য", units: 0, revenue: 0, profit: 0 };
          cur.units += it.quantity;
          cur.revenue += lineRev;
          cur.profit += lineProfit;
          productMap.set(key, cur);
        }
      }
      orderProfits.push({
        id: o.id,
        revenue: orderRevenue,
        profit: orderProfit,
        date: o.createdAt.toISOString(),
        customer: o.customer?.name ?? null,
      });
    }

    // Courier performance over all shipped/booked orders.
    if (o.courierName) {
      const c = courierMap.get(o.courierName) ?? { delivered: 0, returned: 0, total: 0 };
      c.total++;
      if (delivered) c.delivered++;
      if (returned) c.returned++;
      courierMap.set(o.courierName, c);
    }

    // RFM / LTV — realized revenue per customer.
    if (o.customerId && o.customer) {
      const cur = custMap.get(o.customerId) ?? { name: o.customer.name, phone: o.customer.phone, orders: 0, spend: 0, lastOrder: 0 };
      cur.orders++;
      if (delivered && !returned) cur.spend += o.totalAmount;
      const t = o.createdAt.getTime();
      if (t > cur.lastOrder) cur.lastOrder = t;
      custMap.set(o.customerId, cur);
    }
  }

  const products = [...productMap.values()].sort((a, b) => b.profit - a.profit);
  const topProfitable = products.slice(0, 10);
  const lossMaking = products.filter((p) => p.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 10);

  const totalProfit = products.reduce((s, p) => s + p.profit, 0);
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const topOrders = [...orderProfits].sort((a, b) => b.profit - a.profit).slice(0, 10);

  // ── Repeat-purchase rate ────────────────────────────────────────────
  const buyers = [...custMap.values()];
  const buyersWithOrder = buyers.filter((c) => c.orders >= 1).length;
  const repeatBuyers = buyers.filter((c) => c.orders >= 2).length;
  const repeatRate = buyersWithOrder > 0 ? (repeatBuyers / buyersWithOrder) * 100 : 0;

  // ── RFM segments ────────────────────────────────────────────────────
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const segCounts: Record<string, number> = { champions: 0, loyal: 0, new: 0, at_risk: 0, lost: 0, others: 0 };
  const segmented = buyers.map((c) => {
    const recencyDays = c.lastOrder ? Math.floor((now - c.lastOrder) / dayMs) : 9999;
    let segment: string;
    if (c.orders >= 3 && recencyDays <= 30) segment = "champions";
    else if (c.orders >= 2 && recencyDays <= 60) segment = "loyal";
    else if (c.orders === 1 && recencyDays <= 30) segment = "new";
    else if (recencyDays > 90) segment = "lost";
    else if (c.orders >= 2 && recencyDays > 60) segment = "at_risk";
    else segment = "others";
    segCounts[segment]++;
    return { ...c, recencyDays, segment };
  });

  const topCustomers = segmented.sort((a, b) => b.spend - a.spend).slice(0, 15).map((c) => ({
    name: c.name,
    phone: c.phone,
    orders: c.orders,
    spend: Math.round(c.spend),
    recencyDays: c.recencyDays,
    segment: c.segment,
  }));

  const avgLTV = buyersWithOrder > 0 ? buyers.reduce((s, c) => s + c.spend, 0) / buyersWithOrder : 0;

  const courierPerformance = [...courierMap.entries()].map(([name, c]) => ({
    courier: name,
    total: c.total,
    delivered: c.delivered,
    returned: c.returned,
    successRate: c.total > 0 ? Math.round((c.delivered / c.total) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  return NextResponse.json({
    days,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
      margin: Math.round(margin * 10) / 10,
      repeatRate: Math.round(repeatRate * 10) / 10,
      avgLTV: Math.round(avgLTV),
      buyers: buyersWithOrder,
    },
    profit: {
      topProfitable: topProfitable.map((p) => ({ name: p.name, units: p.units, revenue: Math.round(p.revenue), profit: Math.round(p.profit) })),
      lossMaking: lossMaking.map((p) => ({ name: p.name, units: p.units, revenue: Math.round(p.revenue), profit: Math.round(p.profit) })),
      topOrders: topOrders.map((o) => ({ id: o.id, revenue: Math.round(o.revenue), profit: Math.round(o.profit), date: o.date, customer: o.customer })),
    },
    rfm: { segments: segCounts, topCustomers },
    courierPerformance,
  });
}
