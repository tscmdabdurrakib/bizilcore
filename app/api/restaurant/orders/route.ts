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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status");
  const tableId = searchParams.get("tableId");
  const date = searchParams.get("date");

  let dateFilter: { gte?: Date; lt?: Date } | undefined;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { gte: d, lt: next };
  }

  const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served"];
  const statusFilter =
    statuses.length === 1 ? { status: statuses[0] } :
    statuses.length > 1  ? { status: { in: statuses } } :
    searchParams.get("all") === "true" ? {} :
    { status: { in: ACTIVE_STATUSES } };

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      ...statusFilter,
      ...(tableId && { tableId }),
      ...(dateFilter && { createdAt: dateFilter }),
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let body: {
    type?: string; tableId?: string; customerName?: string; customerPhone?: string;
    note?: string;
    items?: { menuItemId: string; quantity: number; note?: string }[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.items?.length) return NextResponse.json({ error: "Items required" }, { status: 400 });

  if ((body.type ?? "dine_in") === "dine_in" && !body.tableId) {
    return NextResponse.json({ error: "Dine-in orders require a table" }, { status: 400 });
  }

  for (const it of body.items) {
    if (!it.menuItemId || !it.quantity || it.quantity < 1) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
    }
  }

  if (body.tableId) {
    const table = await prisma.diningTable.findFirst({
      where: { id: body.tableId, shopId: shop.id },
    });
    if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const menuItemIds = body.items.map(it => it.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, shopId: shop.id },
    select: { id: true, price: true },
  });

  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json({ error: "Invalid menu items" }, { status: 400 });
  }

  const priceMap = new Map(menuItems.map(m => [m.id, m.price]));

  const itemsWithPrices = body.items.map(it => ({
    menuItemId: it.menuItemId,
    quantity: it.quantity,
    unitPrice: priceMap.get(it.menuItemId)!,
    note: it.note ?? null,
  }));

  const totalAmount = itemsWithPrices.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  const order = await prisma.restaurantOrder.create({
    data: {
      shopId: shop.id,
      type: body.type ?? "dine_in",
      tableId: body.tableId ?? null,
      customerName: body.customerName ?? null,
      customerPhone: body.customerPhone ?? null,
      note: body.note ?? null,
      totalAmount,
      status: "pending",
      items: { create: itemsWithPrices },
    },
    include: ORDER_INCLUDE,
  });

  if (body.tableId) {
    await prisma.diningTable.update({
      where: { id: body.tableId },
      data: { status: "occupied" },
    });
  }

  return NextResponse.json(order, { status: 201 });
}
