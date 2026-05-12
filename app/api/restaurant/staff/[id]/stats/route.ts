import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "today";

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  if (range === "today") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const staff = await prisma.staffMember.findFirst({
    where: { id, shopId: shop.id },
    select: {
      id: true,
      jobTitle: true,
      user: { select: { name: true } },
      assignedOrders: {
        where: {
          status: "paid",
          createdAt: { gte: dateFrom, lt: dateTo },
        },
        select: { id: true, totalAmount: true, tipAmount: true, tableId: true },
      },
    },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const orders = staff.assignedOrders;
  return NextResponse.json({
    id: staff.id,
    name: staff.user.name,
    jobTitle: staff.jobTitle,
    totalOrders:   orders.length,
    totalRevenue:  orders.reduce((s, o) => s + o.totalAmount, 0),
    totalTips:     orders.reduce((s, o) => s + (o.tipAmount ?? 0), 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((s, o) => s + o.totalAmount, 0) / orders.length : 0,
    tablesServed:  new Set(orders.filter(o => o.tableId).map(o => o.tableId)).size,
    range,
  });
}
