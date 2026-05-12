import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const ticket = await prisma.kotTicket.findFirst({
    where: { id, shopId: shop.id },
    include: {
      order: {
        select: {
          id: true, type: true, status: true, orderNumber: true,
          table: { select: { number: true, floor: true } },
          customerName: true, note: true,
        },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const ticket = await prisma.kotTicket.findFirst({ where: { id, shopId: shop.id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.action === "start") {
    if (ticket.kitchenStatus !== "pending") {
      return NextResponse.json({ error: "KOT is not in pending state" }, { status: 409 });
    }
    const updated = await prisma.kotTicket.update({
      where: { id },
      data: { kitchenStatus: "preparing" },
      include: {
        order: { select: { id: true, type: true, status: true, orderNumber: true, table: { select: { number: true, floor: true } } } },
      },
    });
    await prisma.restaurantOrder.update({
      where: { id: ticket.orderId },
      data: { status: "preparing" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "ready") {
    if (ticket.kitchenStatus === "ready") {
      return NextResponse.json({ error: "KOT already marked ready" }, { status: 409 });
    }
    const updated = await prisma.kotTicket.update({
      where: { id },
      data: { kitchenStatus: "ready" },
      include: {
        order: { select: { id: true, type: true, status: true, orderNumber: true, table: { select: { number: true, floor: true } } } },
      },
    });
    const allTickets = await prisma.kotTicket.findMany({
      where: { orderId: ticket.orderId },
      select: { kitchenStatus: true },
    });
    const allReady = allTickets.every(t => t.kitchenStatus === "ready");
    if (allReady) {
      await prisma.restaurantOrder.update({
        where: { id: ticket.orderId },
        data: { status: "ready" },
      });
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action. Use: start | ready" }, { status: 400 });
}
