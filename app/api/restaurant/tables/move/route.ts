import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  let body: { orderId?: string; targetTableId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { orderId, targetTableId } = body;
  if (!orderId || !targetTableId) {
    return NextResponse.json({ error: "orderId and targetTableId required" }, { status: 400 });
  }

  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, shopId: shop.id },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const ACTIVE = ["pending", "preparing", "ready", "served", "billing"];
  if (!ACTIVE.includes(order.status)) {
    return NextResponse.json({ error: "Only active orders can be moved" }, { status: 409 });
  }

  const targetTable = await prisma.diningTable.findFirst({ where: { id: targetTableId, shopId: shop.id } });
  if (!targetTable) return NextResponse.json({ error: "Target table not found" }, { status: 404 });

  const oldTableId = order.tableId;

  await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: { tableId: targetTableId },
  });

  await prisma.diningTable.update({
    where: { id: targetTableId },
    data: { status: "occupied" },
  });

  if (oldTableId && oldTableId !== targetTableId) {
    const remaining = await prisma.restaurantOrder.count({
      where: { tableId: oldTableId, status: { in: ACTIVE }, id: { not: orderId } },
    });
    if (remaining === 0) {
      await prisma.diningTable.update({ where: { id: oldTableId }, data: { status: "available" } });
    }
  }

  const updated = await prisma.restaurantOrder.findFirst({
    where: { id: orderId },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true, category: true } } } },
      table: { select: { id: true, number: true, floor: true } },
      kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
    },
  });

  return NextResponse.json(updated);
}
