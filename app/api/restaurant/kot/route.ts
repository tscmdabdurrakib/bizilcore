import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  const tickets = await prisma.kotTicket.findMany({
    where: { shopId: shop.id, ...(orderId && { orderId }) },
    include: { order: { select: { id: true, type: true, table: { select: { number: true } } } } },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const { orderId } = body;

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, shopId: shop.id },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true, category: true } } } },
      table: { select: { number: true, floor: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const kotCount = await prisma.kotTicket.count({ where: { shopId: shop.id } });
  const kotNumber = `KOT-${String(kotCount + 1).padStart(4, "0")}`;

  const items = order.items.map(i => ({
    name: i.menuItem.name,
    category: i.menuItem.category,
    quantity: i.quantity,
    note: i.note ?? null,
  }));

  const [ticket] = await prisma.$transaction([
    prisma.kotTicket.create({
      data: {
        shopId: shop.id,
        orderId,
        kotNumber,
        items,
        note: order.note ?? null,
      },
    }),
    prisma.restaurantOrder.update({
      where: { id: orderId },
      data: { kotSent: true, kotSentAt: new Date(), status: "preparing" },
    }),
  ]);

  return NextResponse.json({ ...ticket, order }, { status: 201 });
}
