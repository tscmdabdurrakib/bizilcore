import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const booking = await prisma.booking.findFirst({
    where: { id, shopId: shop.id },
    include: { room: true, roomServices: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "checked_in") {
    return NextResponse.json({ error: "শুধু checked-in বুকিং চেক-আউট করা যাবে" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const rawPayNow = body.payNow === undefined || body.payNow === null || body.payNow === "" ? 0 : Number(body.payNow);
  const rawAdditional = body.additionalCharges === undefined || body.additionalCharges === null || body.additionalCharges === "" ? 0 : Number(body.additionalCharges);
  if (!Number.isFinite(rawPayNow) || !Number.isFinite(rawAdditional)) {
    return NextResponse.json({ error: "অবৈধ সংখ্যা" }, { status: 400 });
  }
  const finalDuePayment = Math.max(0, rawPayNow);
  const additionalCharges = Math.max(0, rawAdditional);
  const paymentMethod = body.paymentMethod || booking.paymentMethod;

  const servicesTotal = booking.roomServices.reduce((s, r) => s + r.price * r.quantity, 0);
  const newTotal = booking.ratePerNight * booking.nights + booking.extraCharges + additionalCharges + servicesTotal;
  const newAdvance = booking.advancePaid + finalDuePayment;
  const newDue = Math.max(0, newTotal - newAdvance);

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "checked_out",
      checkedOutAt: new Date(),
      extraCharges: booking.extraCharges + additionalCharges,
      totalAmount: newTotal,
      advancePaid: newAdvance,
      dueAmount: newDue,
      paymentMethod,
    },
    include: { room: true, roomServices: true },
  });

  // Auto housekeeping
  if (shop.hotelAutoHousekeeping) {
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "cleaning" },
    });
    await prisma.housekeepingLog.create({
      data: {
        shopId: shop.id,
        roomId: booking.roomId,
        task: "cleaning",
        status: "pending",
        note: `চেক-আউট পরবর্তী cleaning · ${booking.bookingNumber}`,
      },
    });
  } else {
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "vacant" },
    });
  }

  // Update customer last-order timestamp + add to due if any unpaid (tenant-scoped)
  if (booking.customerId) {
    await prisma.customer.updateMany({
      where: { id: booking.customerId, shopId: shop.id },
      data: {
        lastOrderAt: new Date(),
        ...(newDue > 0 ? { dueAmount: { increment: newDue } } : {}),
      },
    });
  }

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "চেক-আউট",
    detail: `${booking.bookingNumber} · ${booking.guestName} · মোট ৳${newTotal}${newDue > 0 ? ` · বাকি ৳${newDue}` : ""}`,
  });

  return NextResponse.json(updated);
}
