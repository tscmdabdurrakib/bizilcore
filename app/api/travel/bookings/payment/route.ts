import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const payment = await prisma.travelPayment.create({
      data: {
        shopId: shop.id,
        bookingId: body.bookingId,
        amount: parseFloat(body.amount),
        method: body.method ?? "cash",
        note: body.note ?? null,
      },
    });

    const booking = await prisma.tourBooking.findUnique({
      where: { id: body.bookingId, shopId: shop.id },
    });

    if (booking) {
      const newAdvance = booking.advancePaid + parseFloat(body.amount);
      const newDue = booking.totalAmount - newAdvance;
      await prisma.tourBooking.update({
        where: { id: body.bookingId },
        data: {
          advancePaid: newAdvance,
          dueAmount: Math.max(0, newDue),
          status: newDue <= 0 ? "completed" : booking.status,
        },
      });
    }

    return NextResponse.json(payment);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
