import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo   = searchParams.get("to");

  const waiters = await prisma.staffMember.findMany({
    where: { shopId: shop.id, isActive: true },
    select: {
      id: true,
      jobTitle: true,
      user: { select: { name: true } },
      assignedOrders: {
        where: {
          status: "paid",
          ...(dateFrom || dateTo ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo   ? { lt:  new Date(new Date(dateTo).setDate(new Date(dateTo).getDate() + 1)) } : {}),
            },
          } : {}),
        },
        select: { id: true, totalAmount: true, tipAmount: true, tableId: true, createdAt: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const result = waiters.map(w => {
    const orders = w.assignedOrders;
    const totalOrders    = orders.length;
    const totalRevenue   = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalTips      = orders.reduce((s, o) => s + (o.tipAmount ?? 0), 0);
    const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const tablesServed   = new Set(orders.filter(o => o.tableId).map(o => o.tableId)).size;
    return {
      id: w.id,
      name: w.user.name,
      jobTitle: w.jobTitle,
      totalOrders,
      totalRevenue,
      totalTips,
      avgOrderValue,
      tablesServed,
    };
  });

  return NextResponse.json(result);
}
