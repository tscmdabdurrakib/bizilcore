import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const booking = await prisma.photoBooking.findFirst({
      where: { id: body.bookingId, shopId: shop.id },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const amount = parseFloat(body.amount);

    const payment = await prisma.photoPayment.create({
      data: {
        bookingId: body.bookingId,
        shopId: shop.id,
        amount,
        method: body.method ?? "cash",
        note: body.note ?? null,
      },
    });

    const newAdvancePaid = booking.advancePaid + amount;
    const newDueAmount = Math.max(0, booking.totalAmount - newAdvancePaid);

    await prisma.photoBooking.update({
      where: { id: booking.id },
      data: { advancePaid: newAdvancePaid, dueAmount: newDueAmount },
    });

    return NextResponse.json(payment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
