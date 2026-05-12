import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const ACTIVE_KITCHEN_STATUSES = ["pending", "preparing", "ready"];

export async function GET(_req: NextRequest) {
  const { shop } = await requireShop();

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      status: { in: ACTIVE_KITCHEN_STATUSES },
    },
    include: {
      items: {
        include: { menuItem: { select: { id: true, name: true, category: true } } },
      },
      table: { select: { id: true, number: true, floor: true } },
      kotTickets: {
        select: { id: true, kotNumber: true, sentAt: true, items: true },
        orderBy: { sentAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();

  let body: { orderId?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.orderId || !body.action) {
    return NextResponse.json({ error: "orderId and action are required" }, { status: 400 });
  }

  const ALLOWED_ACTIONS = ["send_kot", "mark_ready", "mark_served"];
  if (!ALLOWED_ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action. Use: send_kot | mark_ready | mark_served" }, { status: 400 });
  }

  const existing = await prisma.restaurantOrder.findFirst({
    where: { id: body.orderId, shopId: shop.id },
    include: { items: { include: { menuItem: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.action === "send_kot") {
    const kotCount = await prisma.kotTicket.count({ where: { shopId: shop.id } });
    const kotNumber = `KOT-${String(kotCount + 1).padStart(4, "0")}`;
    const kotItems = existing.items.map(i => ({
      name: i.menuItem.name,
      category: i.menuItem.category,
      quantity: i.quantity,
      note: i.note ?? null,
      selectedVariant: i.selectedVariant ?? null,
    }));
    const [ticket, updated] = await prisma.$transaction([
      prisma.kotTicket.create({
        data: {
          shopId: shop.id,
          orderId: body.orderId,
          kotNumber,
          items: kotItems,
          kitchenStatus: "pending",
          note: existing.note ?? null,
        },
      }),
      prisma.restaurantOrder.update({
        where: { id: body.orderId },
        data: { kotSent: true, kotSentAt: new Date(), status: "preparing" },
      }),
    ]);
    return NextResponse.json({ ...updated, latestKot: ticket });
  }

  if (body.action === "mark_ready") {
    const updated = await prisma.restaurantOrder.update({
      where: { id: body.orderId }, data: { status: "ready" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "mark_served") {
    const updated = await prisma.restaurantOrder.update({
      where: { id: body.orderId }, data: { status: "served" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 500 });
}
