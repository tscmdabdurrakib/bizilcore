import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [
    todayOrders,
    pendingApproval,
    printing,
    ready,
    urgentOrders,
    pipelineRows,
    todayRevenue,
  ] = await Promise.all([
    prisma.printOrder.count({ where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.printOrder.count({ where: { shopId: shop.id, status: "design_approval", designApproved: false } }),
    prisma.printOrder.count({ where: { shopId: shop.id, status: "printing" } }),
    prisma.printOrder.count({ where: { shopId: shop.id, status: "ready" } }),
    prisma.printOrder.findMany({
      where: { shopId: shop.id, isUrgent: true, status: { notIn: ["delivered"] } },
      select: { id: true, orderNumber: true, clientName: true, clientPhone: true, deliveryDate: true, status: true, dueAmount: true },
      orderBy: { deliveryDate: "asc" },
      take: 10,
    }),
    prisma.$queryRaw<{ status: string; cnt: bigint }[]>`
      SELECT status, COUNT(*) AS cnt FROM "PrintOrder"
      WHERE "shopId" = ${shop.id} AND status NOT IN ('delivered')
      GROUP BY status
    `,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(pp.amount), 0) AS total
      FROM "PrintPayment" pp
      JOIN "PrintOrder" po ON po.id = pp."orderId"
      WHERE po."shopId" = ${shop.id}
        AND pp."paidAt" >= ${today} AND pp."paidAt" < ${tomorrow}
    `,
  ]);

  const getCount = (s: string) => Number(pipelineRows.find(r => r.status === s)?.cnt ?? 0);

  return NextResponse.json({
    todayOrders,
    pendingApproval,
    printing,
    ready,
    todayRevenue: Number(todayRevenue[0]?.total ?? 0),
    pipeline: {
      received: getCount("received"),
      design_approval: getCount("design_approval"),
      printing: getCount("printing"),
      finishing: getCount("finishing"),
      ready: getCount("ready"),
    },
    urgentOrders: urgentOrders.map(o => ({
      ...o,
      deliveryDate: o.deliveryDate.toISOString(),
    })),
  });
}
