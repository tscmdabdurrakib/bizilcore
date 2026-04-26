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

  const booking = await prisma.booking.findFirst({ where: { id, shopId: shop.id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "বাতিল বুকিং-এ পেমেন্ট নেওয়া যাবে না" }, { status: 400 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "টাকার পরিমাণ ০ এর বেশি হতে হবে" }, { status: 400 });
  }

  const newAdvance = booking.advancePaid + amount;
  const newDue = Math.max(0, booking.totalAmount - newAdvance);

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      advancePaid: newAdvance,
      dueAmount: newDue,
      paymentMethod: body.paymentMethod || booking.paymentMethod,
    },
    include: { room: true },
  });

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "বুকিং পেমেন্ট",
    detail: `${booking.bookingNumber} · ৳${amount}${body.paymentMethod ? ` · ${body.paymentMethod}` : ""}`,
  });

  return NextResponse.json(updated);
}
