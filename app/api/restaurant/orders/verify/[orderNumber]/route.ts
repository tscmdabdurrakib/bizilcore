import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const order = await prisma.restaurantOrder.findFirst({
    where: { orderNumber },
    select: {
      orderNumber: true, status: true, totalAmount: true, paidAmount: true,
      paymentMethod: true, createdAt: true, customerName: true,
      table: { select: { number: true, floor: true } },
      items: {
        where: { isVoided: false },
        select: {
          quantity: true, unitPrice: true,
          menuItem: { select: { name: true } },
        },
      },
      shop: { select: { name: true, phone: true, address: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json(order);
}
