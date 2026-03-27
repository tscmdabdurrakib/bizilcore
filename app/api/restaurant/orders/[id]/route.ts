import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

const ORDER_INCLUDE = {
  items: {
    include: { menuItem: { select: { id: true, name: true, category: true } } },
  },
  table: { select: { id: true, number: true, floor: true } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: ORDER_INCLUDE,
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const existing = await prisma.restaurantOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { status?: string; paidAmount?: number; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updated = await prisma.restaurantOrder.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.paidAmount !== undefined && { paidAmount: body.paidAmount }),
      ...(body.note !== undefined && { note: body.note }),
    },
    include: ORDER_INCLUDE,
  });

  const UNPAID_STATUSES = ["pending", "preparing", "ready", "served"];
  if (body.status === "paid" && existing.tableId) {
    const unpaidOrders = await prisma.restaurantOrder.count({
      where: {
        tableId: existing.tableId,
        status: { in: UNPAID_STATUSES },
        id: { not: id },
      },
    });
    if (unpaidOrders === 0) {
      await prisma.diningTable.update({
        where: { id: existing.tableId },
        data: { status: "empty" },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.restaurantOrder.delete({ where: { id } });

  if (order.tableId) {
    const unpaidOrders = await prisma.restaurantOrder.count({
      where: {
        tableId: order.tableId,
        status: { in: ["pending", "preparing", "ready", "served"] },
      },
    });
    if (unpaidOrders === 0) {
      await prisma.diningTable.update({
        where: { id: order.tableId },
        data: { status: "empty" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
